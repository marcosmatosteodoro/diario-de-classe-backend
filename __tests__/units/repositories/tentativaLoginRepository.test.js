import { jest } from '@jest/globals';

const queryRaw = jest.fn();
const executeRaw = jest.fn();
const entity = { deleteMany: jest.fn() };

jest.unstable_mockModule('../../../src/db/prisma.js', () => ({
  default: { $queryRaw: queryRaw, $executeRaw: executeRaw, tentativaLogin: entity }
}));

const { default: TentativaLoginRepository } = await import(
  '../../../src/repositories/tentativaLoginRepository.js'
);

const normalizar = strings => strings.join('?').replace(/\s+/g, ' ').trim();

describe('TentativaLoginRepository', () => {
  let repository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new TentativaLoginRepository();
  });

  describe('incrementar', () => {
    test('usa uma única instrução $queryRaw parametrizada (tagged template), com upsert atômico', async () => {
      const linha = { contagem: 3, segundosRestantes: 600 };
      queryRaw.mockResolvedValue([linha]);

      const resultado = await repository.incrementar('ip:203.0.113.10', 900);

      expect(resultado).toBe(linha);
      expect(queryRaw).toHaveBeenCalledTimes(1);
      const [strings, ...valores] = queryRaw.mock.calls[0];
      expect(Array.isArray(strings.raw)).toBe(true);
      expect(valores).toHaveLength(4);
      expect(valores[1]).toBe('ip:203.0.113.10');
      expect(valores[2]).toBe(900);
      expect(valores[3]).toBe(900);
      expect(typeof valores[0]).toBe('string');
      expect(normalizar(strings)).not.toContain('ip:203.0.113.10');
    });

    test('a instrução inteira fixa a regra da janela: nova linha com 1; expirada recomeça em 1; vigente soma 1', async () => {
      queryRaw.mockResolvedValue([{ contagem: 1, segundosRestantes: 900 }]);

      await repository.incrementar('k', 900);

      expect(normalizar(queryRaw.mock.calls[0][0])).toBe(
        [
          'INSERT INTO "tentativas_login" ("id", "chave", "contagem", "expiraEm", "dataCriacao", "dataAtualizacao")',
          `VALUES (?, ?, 1, NOW() + (?::int * INTERVAL '1 second'), NOW(), NOW())`,
          'ON CONFLICT ("chave") DO UPDATE SET',
          '"contagem" = CASE WHEN "tentativas_login"."expiraEm" <= NOW() THEN 1 ELSE "tentativas_login"."contagem" + 1 END,',
          `"expiraEm" = CASE WHEN "tentativas_login"."expiraEm" <= NOW() THEN NOW() + (?::int * INTERVAL '1 second') ELSE "tentativas_login"."expiraEm" END,`,
          '"dataAtualizacao" = NOW()',
          'RETURNING "contagem", GREATEST(CEIL(EXTRACT(EPOCH FROM ("tentativas_login"."expiraEm" - NOW())))::int, 1) AS "segundosRestantes", "tentativas_login"."expiraEm"'
        ].join(' ')
      );
    });

    test('propaga o erro do banco (quem chama nega o login)', async () => {
      queryRaw.mockRejectedValue(new Error('db fora'));

      await expect(repository.incrementar('k', 900)).rejects.toThrow('db fora');
    });
  });

  describe('decrementar', () => {
    test('uma instrução atômica parametrizada, nunca abaixo de zero, restrita à janela informada', async () => {
      executeRaw.mockResolvedValue(1);
      const expiraEm = new Date('2026-11-17T12:00:00.000Z');

      await repository.decrementar('ip:203.0.113.10', expiraEm);

      expect(executeRaw).toHaveBeenCalledTimes(1);
      const [strings, ...valores] = executeRaw.mock.calls[0];
      expect(Array.isArray(strings.raw)).toBe(true);
      expect(valores).toEqual(['ip:203.0.113.10', expiraEm]);
      expect(normalizar(strings)).toBe(
        'UPDATE "tentativas_login" SET "contagem" = GREATEST("contagem" - 1, 0), "dataAtualizacao" = NOW() WHERE "chave" = ? AND "expiraEm" = ?'
      );
    });

    test('propaga o erro do banco', async () => {
      executeRaw.mockRejectedValue(new Error('db fora'));

      await expect(repository.decrementar('k', new Date())).rejects.toThrow('db fora');
    });
  });

  test('removerPorChave usa deleteMany (chave inexistente não lança)', async () => {
    entity.deleteMany.mockResolvedValue({ count: 0 });

    await repository.removerPorChave('k');

    expect(entity.deleteMany).toHaveBeenCalledWith({ where: { chave: 'k' } });
  });
});
