import { jest } from '@jest/globals';

const queryRaw = jest.fn();
const executeRaw = jest.fn();
const entity = { create: jest.fn() };

jest.unstable_mockModule('../../../src/db/prisma.js', () => ({
  default: { $queryRaw: queryRaw, $executeRaw: executeRaw, sessaoLogin: entity }
}));

const { default: SessaoLoginRepository } = await import(
  '../../../src/repositories/sessaoLoginRepository.js'
);
const { default: Constants } = await import('../../../src/utilities/constants.js');

const normalizar = strings => strings.join('?').replace(/\s+/g, ' ').trim();

function chamada(mock) {
  const [strings, ...valores] = mock.mock.calls[0];
  expect(Array.isArray(strings.raw)).toBe(true);
  return { sql: normalizar(strings), valores };
}

function semDateNemConcatenacao(valores) {
  valores.forEach(v => {
    expect(v).not.toBeInstanceOf(Date);
    expect(['string', 'number']).toContain(typeof v);
  });
}

describe('SessaoLoginRepository', () => {
  let repository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new SessaoLoginRepository();
  });

  test('getSelectFields é a projeção explícita, sem jti e sem relação aninhada', () => {
    expect(repository.getSelectFields()).toEqual({
      id: true,
      idUsuario: true,
      expiraEm: true,
      encerradaEm: true,
      motivoEncerramento: true
    });
  });

  describe('criar', () => {
    test('delega ao create herdado e devolve só o id', async () => {
      entity.create.mockResolvedValue({ id: 'sid1' });
      const expiraEm = new Date('2026-11-25T12:00:00Z');

      const resultado = await repository.criar({ idUsuario: 'u1', jtiAtual: 'j1', expiraEm });

      expect(resultado).toEqual({ id: 'sid1' });
      expect(entity.create).toHaveBeenCalledWith({
        data: { idUsuario: 'u1', jtiAtual: 'j1', expiraEm },
        select: { id: true }
      });
    });
  });

  describe('lerEstado', () => {
    test('uma leitura por PK parametrizada; a tolerância vem de Constants', async () => {
      const linha = { idUsuario: 'u1', ativa: true };
      queryRaw.mockResolvedValue([linha]);

      const resultado = await repository.lerEstado('sid1');

      expect(resultado).toBe(linha);
      const { sql, valores } = chamada(queryRaw);
      expect(valores).toEqual([Constants.sessionRotationGraceSeconds, 'sid1']);
      semDateNemConcatenacao(valores);
      expect(sql).toContain('FROM "sessoes_login" WHERE "id" = ?');
      expect(sql).not.toContain('sid1');
    });

    test('estado é calculado no SQL com o relógio do banco', async () => {
      queryRaw.mockResolvedValue([]);

      await repository.lerEstado('sid1');

      const { sql } = chamada(queryRaw);
      expect(sql).toContain('("encerradaEm" IS NOT NULL) AS "encerrada"');
      expect(sql).toContain('("encerradaEm" IS NULL AND "expiraEm" > NOW()) AS "ativa"');
      expect(sql).toContain(
        `(NOW() - "rotacionadaEm" <= (?::int * INTERVAL '1 second')) AS "dentroDaTolerancia"`
      );
      expect(sql).toContain('EXTRACT(EPOCH FROM "expiraEm")::int AS "expiraEmEpoch"');
      expect(sql).toContain(
        'GREATEST(CEIL(EXTRACT(EPOCH FROM ("expiraEm" - NOW())))::int, 0) AS "restanteSegundos"'
      );
    });

    test('sessão inexistente devolve null', async () => {
      queryRaw.mockResolvedValue([]);
      await expect(repository.lerEstado('x')).resolves.toBeNull();
    });

    test('não projeta jti além dos dois que o service precisa nem instantes brutos', async () => {
      queryRaw.mockResolvedValue([]);
      await repository.lerEstado('sid1');
      expect(chamada(queryRaw).sql).toContain('SELECT "idUsuario", "jtiAtual", "jtiAnterior",');
    });
  });

  describe('rotacionar', () => {
    test('escrita condicional atômica com RETURNING, só valores parametrizados', async () => {
      const linha = { jtiAtual: 'B', jtiAnterior: 'A' };
      queryRaw.mockResolvedValue([linha]);

      const resultado = await repository.rotacionar('sid1', 'A', 'B');

      expect(resultado).toBe(linha);
      const { sql, valores } = chamada(queryRaw);
      expect(valores).toEqual(['B', 'sid1', 'A']);
      semDateNemConcatenacao(valores);
      expect(sql).toContain(
        'SET "jtiAnterior" = "jtiAtual", "jtiAtual" = ?, "rotacionadaEm" = NOW(), "dataAtualizacao" = NOW()'
      );
      expect(sql).toContain(
        'WHERE "id" = ? AND "jtiAtual" = ? AND "encerradaEm" IS NULL AND "expiraEm" > NOW() RETURNING'
      );
    });

    test('zero linhas (perdeu a corrida) devolve null', async () => {
      queryRaw.mockResolvedValue([]);
      await expect(repository.rotacionar('sid1', 'A', 'C')).resolves.toBeNull();
    });
  });

  describe('substituirSucessor', () => {
    test('exige o anterior apresentado e o atual lido, mantém jtiAnterior', async () => {
      const linha = { jtiAtual: 'D', jtiAnterior: 'A' };
      queryRaw.mockResolvedValue([linha]);

      const resultado = await repository.substituirSucessor('sid1', 'A', 'B', 'D');

      expect(resultado).toBe(linha);
      const { sql, valores } = chamada(queryRaw);
      expect(valores).toEqual(['D', 'sid1', 'A', 'B']);
      semDateNemConcatenacao(valores);
      expect(sql).toContain('SET "jtiAtual" = ?, "rotacionadaEm" = NOW()');
      expect(sql).not.toContain('"jtiAnterior" = "jtiAtual"');
      expect(sql).toContain(
        'WHERE "id" = ? AND "jtiAnterior" = ? AND "jtiAtual" = ? AND "encerradaEm" IS NULL AND "expiraEm" > NOW() RETURNING'
      );
    });

    test('zero linhas devolve null', async () => {
      queryRaw.mockResolvedValue([]);
      await expect(repository.substituirSucessor('s', 'A', 'B', 'D')).resolves.toBeNull();
    });
  });

  describe('encerrar', () => {
    test('só encerra sessão ainda aberta, por PK, e devolve se encerrou', async () => {
      queryRaw.mockResolvedValueOnce([{ id: 'sid1' }]).mockResolvedValueOnce([]);

      await expect(repository.encerrar('sid1', 'sair')).resolves.toBe(true);
      const { sql, valores } = chamada(queryRaw);
      expect(valores).toEqual(['sair', 'sid1']);
      expect(sql).toContain('SET "encerradaEm" = NOW(), "motivoEncerramento" = ?');
      expect(sql).toContain('WHERE "id" = ? AND "encerradaEm" IS NULL RETURNING');
      await expect(repository.encerrar('sid1', 'sair')).resolves.toBe(false);
    });
  });

  describe('limparDoUsuario', () => {
    test('apaga só as do usuário, vencidas ou encerradas além do limite, comparação inteira', async () => {
      executeRaw.mockResolvedValue(2);

      const resultado = await repository.limparDoUsuario('u1', 7);

      expect(resultado).toBe(2);
      const { sql, valores } = chamada(executeRaw);
      expect(valores).toEqual(['u1', 7, 7]);
      expect(sql).toContain('DELETE FROM "sessoes_login" WHERE "idUsuario" = ?');
      expect(sql).toContain(
        `AND (NOW() - (?::int * INTERVAL '1 day') > "expiraEm" OR NOW() - (?::int * INTERVAL '1 day') > "encerradaEm")`
      );
    });
  });

  test('propaga o erro do banco (o consumidor traduz em 503)', async () => {
    queryRaw.mockRejectedValue(new Error('db fora'));
    await expect(repository.rotacionar('s', 'A', 'B')).rejects.toThrow('db fora');
  });
});
