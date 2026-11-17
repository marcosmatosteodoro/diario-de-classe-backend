import { jest } from '@jest/globals';
import request from 'supertest';
import util from 'node:util';
import { cookiesDaSessao } from '../../mocks/cookiesDaSessao.js';

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
  let TentativaLoginRepository;
  let original;
  let isProductionOriginal;

  beforeAll(async () => {
    jest.resetModules();
    jest.unstable_mockModule('../../../src/InitialSetting.js', () => ({
      InitialSetting: { handle: jest.fn() }
    }));
    ({ default: Constants } = await import('../../../src/utilities/constants.js'));
    ({ LoginService } = await import('../../../src/services/auth/loginService.js'));
    ({ default: TentativaLoginRepository } = await import(
      '../../../src/repositories/tentativaLoginRepository.js'
    ));
    ({ default: app } = await import('../../../src/app.js?login'));
    original = LoginService.handle;
    isProductionOriginal = Constants.isProduction;
  }, TIMEOUT_IMPORT_FRIO);

  // O limitador persiste em TentativaLogin: o dublê dá estado limpo por caso e deixa o
  // teto controlável. A regra da janela em SQL é provada em tentativaLoginRepository.test.js.
  let contagens;
  beforeEach(() => {
    contagens = new Map();
    jest
      .spyOn(TentativaLoginRepository.prototype, 'incrementar')
      .mockImplementation(async chave => {
        const contagem = (contagens.get(chave) ?? 0) + 1;
        contagens.set(chave, contagem);
        return { contagem, segundosRestantes: 900, expiraEm: '1' };
      });
    jest.spyOn(TentativaLoginRepository.prototype, 'decrementar').mockResolvedValue(1);
    jest
      .spyOn(TentativaLoginRepository.prototype, 'removerPorChave')
      .mockResolvedValue({ count: 1 });
  });

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

  test('500: ZerarTentativas lançando no sucesso nega o login sem cookie de sessão', async () => {
    mockarSucesso();
    TentativaLoginRepository.prototype.removerPorChave.mockRejectedValue(new Error('banco fora'));
    const res = await entrar();

    expect(res.status).toBe(500);
    expect(res.body).not.toHaveProperty('accessToken');
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
      // Sinks do caminho de login: console.* (LoggerManager, morgan do app, handleError do
      // controller, limitador) e escrita direta em stdout/stderr (logger de query do Prisma).
      for (const fluxo of [process.stdout, process.stderr]) {
        const spy = jest.spyOn(fluxo, 'write').mockImplementation(chunk => {
          textos.push(String(chunk));
          return true;
        });
        spies.push(spy);
      }
      return { textos, spies, texto: () => textos.join('\n') };
    };

    test.each([
      ['access', AT],
      ['refresh', RT],
      ['cookie', COOKIE_RECEBIDO]
    ])('controle de detecção: a captura enxerga o sentinela de %s', (_, sentinela) => {
      const cap = capturar();
      console.error({ aninhado: { valor: sentinela } });
      process.stdout.write(`${sentinela}\n`);
      process.stderr.write(`${sentinela}\n`);
      expect(cap.textos).toHaveLength(3);
      for (const t of cap.textos) expect(t).toContain(sentinela);
    });

    const semSentinelas = (cap, res) => {
      for (const sentinela of [AT, RT, COOKIE_RECEBIDO]) {
        expect(cap.texto()).not.toContain(sentinela);
        expect(JSON.stringify(res.body)).not.toContain(sentinela);
      }
    };

    test('401: o warn de falha de login (limitador + controller) não carrega credenciais', async () => {
      LoginService.handle = jest.fn(async () => null);
      const cap = capturar();

      const res = await entrar();

      expect(res.status).toBe(401);
      expect(cap.texto()).toContain('Falha de login');
      semSentinelas(cap, res);
    });

    test('429: o warn de bloqueio do limitador não carrega credenciais', async () => {
      LoginService.handle = jest.fn(async () => null);
      for (let i = 0; i < 5; i += 1) await entrar();
      const cap = capturar();

      const res = await entrar();

      expect(res.status).toBe(429);
      expect(cap.texto()).toContain('Login bloqueado');
      semSentinelas(cap, res);
    });

    test('503: erro do contador (ORM com argumentos embutidos) loga só name/code', async () => {
      TentativaLoginRepository.prototype.incrementar.mockImplementation(async () => {
        const erro = new Error(`argumentos ${AT} ${RT} ${COOKIE_RECEBIDO}`);
        erro.name = 'PrismaClientKnownRequestError';
        erro.code = 'P2002';
        erro.meta = { campo: `${AT} ${RT} ${COOKIE_RECEBIDO}` };
        throw erro;
      });
      const cap = capturar();

      const res = await entrar();

      expect(res.status).toBe(503);
      expect(cap.texto()).toContain('Erro ao consultar o limite');
      semSentinelas(cap, res);
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
