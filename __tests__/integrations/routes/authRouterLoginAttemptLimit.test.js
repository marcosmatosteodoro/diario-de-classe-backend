import express from 'express';
import request from 'supertest';
import util from 'node:util';
import { jest } from '@jest/globals';
import routes from '../../../src/routes.js';
import Constants from '../../../src/utilities/constants.js';
import TentativaLoginRepository from '../../../src/repositories/tentativaLoginRepository.js';
import { LoginService } from '../../../src/services/auth/loginService.js';

const SENHA_SENTINELA = 'S3nh4-Sent1nela-Z9X8';
const EMAIL = 'joao.silva@example.com';
const IP = '203.0.113.10';

const loginOk = { accessToken: 'a', refreshToken: 'r', tokenType: 'Bearer', user: { id: '1' } };

function buildApp() {
  const app = express();
  app.set('trust proxy', true);
  app.use(express.json());
  app.use((req, res, next) => {
    req.t = key => key;
    next();
  });
  // Router real de src/routes.js: a ordem dos middlewares de /auth/login é o que se prova.
  app.use('/', routes);
  return app;
}

// Armazena como a tabela: janela fixa por chave, com o relógio de Date.now().
function installStore() {
  const store = new Map();
  jest
    .spyOn(TentativaLoginRepository.prototype, 'incrementar')
    .mockImplementation(async (chave, janelaSegundos) => {
      const atual = store.get(chave);
      const agora = Date.now();
      if (!atual || atual.expiraEm.getTime() <= agora) {
        const novo = { contagem: 1, expiraEm: new Date(agora + janelaSegundos * 1000) };
        store.set(chave, novo);
        return novo;
      }
      atual.contagem += 1;
      return atual;
    });
  jest
    .spyOn(TentativaLoginRepository.prototype, 'buscarPorChave')
    .mockImplementation(async chave => store.get(chave) ?? null);
  jest
    .spyOn(TentativaLoginRepository.prototype, 'removerPorChave')
    .mockImplementation(async chave => ({ count: store.delete(chave) ? 1 : 0 }));
  return store;
}

const login = (app, { email = EMAIL, senha = 'errada', ip = IP } = {}) =>
  request(app).post('/auth/login').set('X-Forwarded-For', ip).send({ email, senha });

describe('POST /auth/login (router real) - limite de tentativas por janela', () => {
  let app;
  let store;
  let now;
  let loginSpy;
  let warnSpy;
  let errorSpy;

  const capturado = spy =>
    spy.mock.calls
      .map(args => util.format(...args.map(a => util.inspect(a, { depth: null }))))
      .join('\n');

  beforeEach(() => {
    now = 1_800_000_000_000;
    jest.spyOn(Date, 'now').mockImplementation(() => now);
    store = installStore();
    app = buildApp();
    loginSpy = jest.spyOn(LoginService, 'handle').mockResolvedValue(null);
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  test('após o teto de falhas no mesmo IP+e-mail, a próxima recebe 429 com Retry-After e não chama o LoginService', async () => {
    for (let i = 0; i < Constants.loginMaxTentativasPorEmail; i++) {
      const r = await login(app);
      expect(r.status).toBe(401);
    }
    expect(loginSpy).toHaveBeenCalledTimes(5);

    loginSpy.mockResolvedValue(loginOk);
    const r = await login(app, { senha: 'certa' });

    expect(r.status).toBe(429);
    expect(r.headers['retry-after']).toBe('900');
    expect(r.body).toEqual({ message: 'auth.login.too_many_attempts' });
    expect(loginSpy).toHaveBeenCalledTimes(5);
  });

  test('Retry-After reflete os segundos restantes da janela', async () => {
    for (let i = 0; i < 5; i++) await login(app);
    now += 100_000;

    const r = await login(app);

    expect(r.status).toBe(429);
    expect(r.headers['retry-after']).toBe('800');
  });

  test('e-mail diferente no mesmo IP não é bloqueado pelo teto por IP+e-mail', async () => {
    for (let i = 0; i < 5; i++) await login(app);

    const r = await login(app, { email: 'outro@example.com' });

    expect(r.status).toBe(401);
  });

  test('mesmo e-mail em IP diferente não é bloqueado', async () => {
    for (let i = 0; i < 5; i++) await login(app);

    const r = await login(app, { ip: '203.0.113.99' });

    expect(r.status).toBe(401);
  });

  test('e-mail com caixa/espaços diferentes cai na mesma chave', async () => {
    for (let i = 0; i < 5; i++) await login(app, { email: '  Joao.Silva@EXAMPLE.com ' });

    const r = await login(app);

    expect(r.status).toBe(429);
  });

  test('teto por IP com e-mails variados: a tentativa seguinte ao teto recebe 429', async () => {
    for (let i = 0; i < Constants.loginMaxTentativasPorIp; i++) {
      const r = await login(app, { email: `pessoa${i}@example.com` });
      expect(r.status).toBe(401);
    }
    const chamadas = loginSpy.mock.calls.length;

    const r = await login(app, { email: 'nova.pessoa@example.com' });

    expect(r.status).toBe(429);
    expect(r.headers['retry-after']).toBeDefined();
    expect(loginSpy).toHaveBeenCalledTimes(chamadas);
  });

  test('sucesso zera o contador IP+e-mail', async () => {
    for (let i = 0; i < 4; i++) await login(app);
    loginSpy.mockResolvedValue(loginOk);
    expect((await login(app, { senha: 'certa' })).status).toBe(200);

    loginSpy.mockResolvedValue(null);
    for (let i = 0; i < 4; i++) {
      expect((await login(app)).status).toBe(401);
    }
    expect((await login(app)).status).toBe(401);
    expect((await login(app)).status).toBe(429);
  });

  test('janela expirada recomeça a contagem', async () => {
    for (let i = 0; i < 5; i++) await login(app);
    expect((await login(app)).status).toBe(429);

    now += Constants.loginJanelaSegundos * 1000 + 1;

    expect((await login(app)).status).toBe(401);
    expect(store.get(`ip:${IP}`).contagem).toBe(1);
  });

  test('credencial inválida devolve 401 com a mensagem de sempre', async () => {
    const r = await login(app);

    expect(r.status).toBe(401);
    expect(r.body).toEqual({ message: 'auth.login.unauthorized' });
  });

  test('credencial ausente segue sem chegar ao serviço (validação existente) e não consome o contador', async () => {
    const r = await request(app).post('/auth/login').set('X-Forwarded-For', IP).send({});

    expect(r.status).toBe(422);
    expect(loginSpy).not.toHaveBeenCalled();
    expect(store.size).toBe(0);
  });

  describe('log', () => {
    test('controle positivo: a captura detecta a senha quando ela está no log', () => {
      console.warn('x', { senha: SENHA_SENTINELA });
      console.error('y', new Error(`Invalid invocation senha: "${SENHA_SENTINELA}"`));

      expect(capturado(warnSpy)).toContain(SENHA_SENTINELA);
      expect(capturado(errorSpy)).toContain(SENHA_SENTINELA);
    });

    test('falha de login loga IP e e-mail mascarado, sem senha nem e-mail em claro', async () => {
      const r = await login(app, { senha: SENHA_SENTINELA });

      expect(r.status).toBe(401);
      const texto = capturado(warnSpy);
      expect(texto).toContain(IP);
      expect(texto).toContain('j***@example.com');
      expect(texto).not.toContain(SENHA_SENTINELA);
      expect(texto).not.toContain(EMAIL);
    });

    test('bloqueio loga IP e e-mail mascarado, sem senha nem e-mail em claro', async () => {
      for (let i = 0; i < 5; i++) await login(app);
      warnSpy.mockClear();

      const r = await login(app, { senha: SENHA_SENTINELA });

      expect(r.status).toBe(429);
      expect(warnSpy).toHaveBeenCalledTimes(1);
      const texto = capturado(warnSpy);
      expect(texto).toContain(IP);
      expect(texto).toContain('j***@example.com');
      expect(texto).not.toContain(SENHA_SENTINELA);
      expect(texto).not.toContain(EMAIL);
    });
  });

  describe('fail secure', () => {
    const erroDoOrm = () => {
      const e = new Error(`Invalid invocation: email "${EMAIL}" senha "${SENHA_SENTINELA}"`);
      e.name = 'PrismaClientKnownRequestError';
      e.code = 'P1001';
      return e;
    };

    test('contador indisponível na consulta: login negado, LoginService não chamado, log sem e-mail nem senha', async () => {
      TentativaLoginRepository.prototype.buscarPorChave.mockRejectedValue(erroDoOrm());
      loginSpy.mockResolvedValue(loginOk);

      const r = await login(app, { senha: SENHA_SENTINELA });

      expect(r.status).toBe(503);
      expect(r.body).not.toHaveProperty('accessToken');
      expect(loginSpy).not.toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalled();
      const texto = capturado(errorSpy);
      expect(texto).not.toContain(SENHA_SENTINELA);
      expect(texto).not.toContain(EMAIL);
    });

    test('contador falhando ao registrar a falha: resposta é erro, nunca sucesso', async () => {
      TentativaLoginRepository.prototype.incrementar.mockRejectedValue(erroDoOrm());

      const r = await login(app, { senha: SENHA_SENTINELA });

      expect(r.status).toBe(500);
      expect(capturado(errorSpy)).not.toContain(SENHA_SENTINELA);
      expect(capturado(errorSpy)).not.toContain(EMAIL);
    });

    test('contador falhando ao zerar no sucesso: login negado, sem tokens', async () => {
      loginSpy.mockResolvedValue(loginOk);
      TentativaLoginRepository.prototype.removerPorChave.mockRejectedValue(erroDoOrm());

      const r = await login(app, { senha: 'certa' });

      expect(r.status).toBe(500);
      expect(r.body).not.toHaveProperty('accessToken');
    });
  });
});
