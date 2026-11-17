import { jest } from '@jest/globals';
import request from 'supertest';
import util from 'node:util';

// O import a frio da árvore de app.js chega perto do testTimeout global (10s).
const TIMEOUT_IMPORT_FRIO = 30000;

const AT = 'AT-SENTINELA';
const RT = 'RT-SENTINELA';
const COOKIE_RECEBIDO = 'COOKIE-SENTINELA';
const CREDENCIAIS = { email: 'ana@example.com', senha: 'senha-valida' };

describe('POST /api/auth/login (app real)', () => {
  let app;
  let Constants;
  let LoginService;
  let original;
  let isProductionOriginal;

  beforeAll(async () => {
    jest.resetModules();
    jest.unstable_mockModule('../../../src/InitialSetting.js', () => ({
      InitialSetting: { handle: jest.fn() }
    }));
    ({ default: Constants } = await import('../../../src/utilities/constants.js'));
    ({ LoginService } = await import('../../../src/services/auth/loginService.js'));
    ({ default: app } = await import('../../../src/app.js?login'));
    original = LoginService.handle;
    isProductionOriginal = Constants.isProduction;
  }, TIMEOUT_IMPORT_FRIO);

  afterEach(() => {
    LoginService.handle = original;
    Constants.isProduction = isProductionOriginal;
    jest.restoreAllMocks();
  });

  const respostaDoService = () => ({
    accessToken: AT,
    refreshToken: RT,
    tokenType: 'Bearer',
    expiresIn: 900,
    user: { id: 'u1', email: CREDENCIAIS.email },
    configuracao: { id: 'c1' }
  });

  const mockarSucesso = () => {
    LoginService.handle = jest.fn(async (email, senha) => {
      expect([email, senha]).toEqual([CREDENCIAIS.email, CREDENCIAIS.senha]);
      return respostaDoService();
    });
  };

  // O i18n do app grava o cookie `lng` em toda resposta; o que a sessão controla é o
  // subconjunto de set-cookie que não é o de idioma.
  const cookiesDaSessao = res =>
    (res.headers['set-cookie'] ?? []).filter(c => !c.startsWith('lng='));

  const entrar = () =>
    request(app)
      .post('/api/auth/login')

      .set('Cookie', `bls_sessao=${COOKIE_RECEBIDO}`)
      .send(CREDENCIAIS);

  test('200: refresh só no cookie, nunca no corpo', async () => {
    mockarSucesso();
    const res = await entrar();

    expect(res.status).toBe(200);
    expect(res.body).not.toHaveProperty('refreshToken');
    expect(JSON.stringify(res.body)).not.toContain(RT);
    for (const chave of ['accessToken', 'tokenType', 'expiresIn', 'user', 'configuracao']) {
      expect(res.body).toHaveProperty(chave);
    }
    const setCookie = cookiesDaSessao(res);
    expect(setCookie).toHaveLength(1);
    expect(setCookie[0].startsWith(`bls_sessao=${RT}`)).toBe(true);
    expect(setCookie[0]).toContain('Path=/api/auth');
    expect(setCookie[0]).toContain('Max-Age=604800');
    expect(setCookie[0]).toContain('HttpOnly');
    expect(setCookie[0]).toContain('SameSite=Strict');
    expect(setCookie[0]).not.toContain('Domain');
    expect(setCookie[0]).not.toContain('Secure');
  });

  test('200 em produção: o cookie leva Secure', async () => {
    mockarSucesso();
    Constants.isProduction = true;
    const res = await entrar();

    expect(res.status).toBe(200);
    expect(cookiesDaSessao(res)[0]).toContain('Secure');
  });

  test('401: login recusado não grava nem toca cookie, mesmo com cookie anterior', async () => {
    LoginService.handle = jest.fn(async () => null);
    const res = await entrar();

    expect(res.status).toBe(401);
    expect(cookiesDaSessao(res)).toEqual([]);
  });

  describe('credenciais fora de log e de corpo de erro', () => {
    const METODOS = ['log', 'info', 'warn', 'error', 'debug'];

    const capturar = () => {
      const textos = [];
      const spies = METODOS.map(m =>
        jest
          .spyOn(console, m)
          .mockImplementation((...args) =>
            textos.push(
              args
                .map(a => (typeof a === 'string' ? a : util.inspect(a, { depth: null })))
                .join(' ')
            )
          )
      );
      return { textos, spies, texto: () => textos.join('\n') };
    };

    test.each([
      ['access', AT],
      ['refresh', RT],
      ['cookie', COOKIE_RECEBIDO]
    ])('controle de detecção: a captura enxerga o sentinela de %s', (_, sentinela) => {
      const cap = capturar();
      console.error({ aninhado: { valor: sentinela } });
      expect(cap.texto()).toContain(sentinela);
    });

    test('falha inesperada do service: 500 sem credenciais no log nem no corpo (log)', async () => {
      expect(Constants.env).not.toBe('development');
      // Erro do ORM embute argumentos na mensagem e em meta; o log só pode ter name/code/chaves.
      LoginService.handle = jest.fn(async () => {
        const erro = new Error(`argumentos ${AT} ${RT} ${COOKIE_RECEBIDO}`);
        erro.name = 'PrismaClientKnownRequestError';
        erro.code = 'P2002';
        erro.meta = { campo: `${AT} ${RT} ${COOKIE_RECEBIDO}` };
        throw erro;
      });
      const cap = capturar();

      const res = await entrar();

      expect(res.status).toBe(500);
      expect(cap.spies.some(s => s.mock.calls.length > 0)).toBe(true);
      for (const sentinela of [AT, RT, COOKIE_RECEBIDO]) {
        expect(cap.texto()).not.toContain(sentinela);
        expect(JSON.stringify(res.body)).not.toContain(sentinela);
      }
    });

    test('sucesso: nenhuma credencial em log (log)', async () => {
      mockarSucesso();
      const cap = capturar();

      const res = await entrar();

      expect(res.status).toBe(200);
      for (const sentinela of [AT, RT, COOKIE_RECEBIDO]) {
        expect(cap.texto()).not.toContain(sentinela);
      }
    });
  });
});
