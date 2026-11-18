import { jest } from '@jest/globals';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import request from 'supertest';
import { createJwt } from '../../../src/utilities/createJwt.js';
import { cuid, tokenDe } from '../../mocks/accessDeTeste.js';
import { capturarLog } from '../../mocks/capturaDeLog.js';
import {
  criarArmazenamentoExterno,
  instalarRegistroFalso,
  semearSessao
} from '../../mocks/sessoesEmMemoria.js';

// O import a frio da árvore de app.js chega perto do testTimeout global (10s).
const TIMEOUT_IMPORT_FRIO = 30000;

const pt = JSON.parse(readFileSync(join(process.cwd(), 'src/locales/pt/translation.json'), 'utf8'));
const ORIGEM = 'https://app.example.com';
const LISTAGEM = '/api/alunos';
// Status de GET /api/alunos com o acesso a dado simulado devolvendo lista vazia (medido no baseline).
const STATUS_ROTA_AUTENTICADA = 204;
const SAIR = '/api/auth/logout';
const USUARIO = cuid('professor1');
const SENTINELA = 'SENTINELA-SESSAO-503';

const RECUSA_401 = { error: 'UnauthorizedError', message: pt.api.errors.unauthorized };
const RECUSA_503 = {
  error: 'ServiceUnavailableError',
  message: pt.api.errors.service_unavailable
};

describe('sessão consultada a cada requisição autenticada (app real, registro falso)', () => {
  let app;
  let Constants;
  let armazenamento;
  let registro;
  let corsOriginal;
  let carregamentos = 0;

  // Módulo novo do app: nenhum estado em memória do anterior; só o armazenamento externo sobrevive.
  const carregarApp = async () => {
    jest.resetModules();
    jest.unstable_mockModule('../../../src/InitialSetting.js', () => ({
      InitialSetting: { handle: jest.fn() }
    }));
    carregamentos += 1;
    ({ default: Constants } = await import('../../../src/utilities/constants.js'));
    ({ default: app } = await import(`../../../src/app.js?processo=${carregamentos}`));
    const { default: AbstractRepository } = await import(
      '../../../src/repositories/abstractRepository.js'
    );
    jest.spyOn(AbstractRepository.prototype, 'selectMany').mockResolvedValue([]);
    registro = await instalarRegistroFalso(armazenamento);
    return app;
  };

  const sidA = cuid('sessao-a');
  const sidB = cuid('sessao-b');
  const accessDe = sid => `Bearer ${tokenDe({ id: USUARIO, role: 'professor', sid })}`;
  const refreshDe = (sid, jti = 'jti-atual-de-teste') =>
    createJwt(
      { sub: USUARIO, typ: Constants.refreshTokenType, sid, jti },
      Constants.jwtRefreshSecret,
      Constants.refreshExp
    );

  const listar = access => request(app).get(LISTAGEM).set('Authorization', access);
  const sair = refresh =>
    request(app).post(SAIR).set('Origin', ORIGEM).set('Cookie', `bls_sessao=${refresh}`);

  beforeAll(() => {
    corsOriginal = process.env.CORS_ORIGINS;
    process.env.CORS_ORIGINS = ORIGEM;
  });

  afterAll(() => {
    if (corsOriginal === undefined) delete process.env.CORS_ORIGINS;
    else process.env.CORS_ORIGINS = corsOriginal;
  });

  beforeEach(async () => {
    armazenamento = criarArmazenamentoExterno();
    semearSessao(armazenamento, { sid: sidA, idUsuario: USUARIO });
    await carregarApp();
  }, TIMEOUT_IMPORT_FRIO);

  describe('sair derruba o acesso já emitido (AC-004-001)', () => {
    test('o mesmo access: aceito antes de sair, 401 depois', async () => {
      const access = accessDe(sidA);

      const antes = await listar(access);
      const saida = await sair(refreshDe(sidA));
      const depois = await listar(access);

      expect(antes.status).toBe(STATUS_ROTA_AUTENTICADA);
      expect(saida.status).toBe(204);
      expect(depois.status).toBe(401);
      expect(depois.body).toEqual(RECUSA_401);
    });
  });

  describe('sair numa sessão não toca a outra (AC-004-003)', () => {
    test('encerrar A recusa o access de A e mantém o de B', async () => {
      semearSessao(armazenamento, { sid: sidB, idUsuario: USUARIO });

      const saida = await sair(refreshDe(sidA));
      const deA = await listar(accessDe(sidA));
      const deB = await listar(accessDe(sidB));

      expect(saida.status).toBe(204);
      expect(deA.status).toBe(401);
      expect(deB.status).toBe(STATUS_ROTA_AUTENTICADA);
    });
  });

  describe('sair com o refresh já trocado (AC-004-024)', () => {
    test('cookie com jti diferente do jtiAtual: 204 e o access da sessão é 401', async () => {
      semearSessao(armazenamento, { sid: sidA, idUsuario: USUARIO, jtiAtual: 'jti-novo' });
      const access = accessDe(sidA);

      expect((await listar(access)).status).toBe(STATUS_ROTA_AUTENTICADA);
      const saida = await sair(refreshDe(sidA, 'jti-velho-ja-trocado'));
      const depois = await listar(access);

      expect(saida.status).toBe(204);
      expect(depois.status).toBe(401);
      expect(armazenamento.sessoes.get(sidA).encerrada).toBe(true);
    });
  });

  describe('credencial sem sessão registrada (AC-004-010)', () => {
    test.each([
      [
        'access de ver 2 com sid válido e sessão ativa',
        () => tokenDe({ id: USUARIO, sid: sidA, ver: 2 })
      ],
      [
        'access de ver 3 sem sid',
        () => createJwt({ sub: USUARIO, ver: Constants.accessTokenVersion }, Constants.jwtSecret)
      ],
      ['sid string vazia', () => tokenDe({ id: USUARIO, sid: '' })],
      ['sid numérico', () => tokenDe({ id: USUARIO, sid: 12345 })],
      // 5 KB: acima disso o cabeçalho passa do limite do Node (431) antes do middleware.
      ['sid de 5 KB', () => tokenDe({ id: USUARIO, sid: 's'.repeat(5 * 1024) })]
    ])('%s: 401 e nenhuma consulta ao registro', async (_nome, fabricar) => {
      const res = await listar(`Bearer ${fabricar()}`);

      expect(res.status).toBe(401);
      expect(res.body).toEqual(RECUSA_401);
      expect(registro.lerEstado).not.toHaveBeenCalled();
    });

    test('controle: sid válido que o registro desconhece consulta 1 vez e é 401', async () => {
      const res = await listar(accessDe(cuid('sessao-fantasma')));

      expect(registro.lerEstado).toHaveBeenCalledTimes(1);
      expect(res.status).toBe(401);
      expect(res.body).toEqual(RECUSA_401);
    });
  });

  describe('estado fora da memória do processo (AC-004-011, AC-004-012)', () => {
    test('encerramento sobrevive a processo novo: o access antigo segue recusado', async () => {
      const access = accessDe(sidA);
      expect((await sair(refreshDe(sidA))).status).toBe(204);

      await carregarApp();
      const res = await listar(access);

      expect(res.status).toBe(401);
      expect(res.body).toEqual(RECUSA_401);
    });

    test('controle: sem o encerramento no armazenamento, o app novo aceita o mesmo access', async () => {
      const access = accessDe(sidA);

      await carregarApp();
      const res = await listar(access);

      expect(res.status).toBe(STATUS_ROTA_AUTENTICADA);
    });

    test('sessão viva sobrevive a processo novo: o mesmo access é aceito antes e depois', async () => {
      const access = accessDe(sidA);
      expect((await listar(access)).status).toBe(STATUS_ROTA_AUTENTICADA);

      await carregarApp();

      expect((await listar(access)).status).toBe(STATUS_ROTA_AUTENTICADA);
    });
  });

  describe('registro indisponível (AC-004-013, parte a)', () => {
    const falharRegistro = () => {
      const erro = new Error(`Invalid invocation ... ${SENTINELA}`);
      erro.name = 'PrismaClientKnownRequestError';
      erro.code = 'P1001';
      registro.lerEstado.mockRejectedValue(erro);
    };

    test('503 distinto do 401, sem credencial nem sentinela no corpo e no log', async () => {
      falharRegistro();
      const log = capturarLog();
      const access = accessDe(sidA);

      const res = await listar(access);

      expect(res.status).toBe(503);
      expect(res.status).not.toBe(401);
      expect(res.body).toEqual(RECUSA_503);
      expect(res.body.error).not.toBe(RECUSA_401.error);
      const corpo = JSON.stringify(res.body);
      expect(corpo).not.toContain(SENTINELA);
      expect(corpo).not.toContain(access.slice(7));
      expect(log.texto()).not.toContain(SENTINELA);
      expect(log.texto()).not.toContain(access.slice(7));
    });

    test('controles do log: a captura enxerga o sentinela e a causa é registrada com name e code', async () => {
      falharRegistro();
      const log = capturarLog();

      await listar(accessDe(sidA));

      expect(log.texto()).toContain('P1001');
      expect(log.texto()).toContain('PrismaClientKnownRequestError');
      console.error(SENTINELA);
      expect(log.texto()).toContain(SENTINELA);
    });
  });

  describe('orçamento de uma consulta por requisição (AC-004-016, parte)', () => {
    const espiarOutros = async () => {
      const { default: SessaoLoginRepository } = await import(
        '../../../src/repositories/sessaoLoginRepository.js'
      );
      const prototipo = SessaoLoginRepository.prototype;
      return Object.getOwnPropertyNames(prototipo)
        .filter(n => !['constructor', 'lerEstado', 'getEntity', 'getSelectFields'].includes(n))
        .map(nome => jest.spyOn(prototipo, nome));
    };
    const somaDeChamadas = espioes => espioes.reduce((t, e) => t + e.mock.calls.length, 0);

    test('uma requisição autenticada: lerEstado 1 vez e nenhum outro método do repository', async () => {
      const outros = await espiarOutros();

      const res = await listar(accessDe(sidA));

      expect(res.status).toBe(STATUS_ROTA_AUTENTICADA);
      expect(registro.lerEstado).toHaveBeenCalledTimes(1);
      expect(somaDeChamadas(outros)).toBe(0);
    });

    test('controle positivo: o sair chama encerrar e a soma o enxerga', async () => {
      const outros = await espiarOutros();

      await sair(refreshDe(sidA));

      expect(registro.encerrar).toHaveBeenCalledTimes(1);
      expect(somaDeChamadas(outros)).toBe(1);
    });
  });
});
