import { jest } from '@jest/globals';
import request from 'supertest';
import { readFileSync } from 'node:fs';
import { URL } from 'node:url';
import { cookiesDaSessao } from '../../mocks/cookiesDaSessao.js';
import { capturarLog } from '../../mocks/capturaDeLog.js';
import { CUSTO_BARATO } from '../../mocks/passwordCustoBarato.js';
import { hashSenha } from '../../../src/utilities/password.js';
import { parseJwt } from '../../../src/utilities/verifyJwt.js';

// O import a frio da árvore de app.js chega perto do testTimeout global (10s).
const TIMEOUT_IMPORT_FRIO = 30000;

const traducao = JSON.parse(
  readFileSync(new URL('../../../src/locales/pt/translation.json', import.meta.url), 'utf8')
);

const AT = 'AT-SENTINELA';
const RT = 'RT-SENTINELA';
const COOKIE_RECEBIDO = 'COOKIE-SENTINELA';
const CREDENCIAIS = { email: 'ana@example.com', senha: 'senha-valida' };

describe('POST /api/auth/login (app real)', () => {
  let app;
  let Constants;
  let LoginService;
  let TentativaLoginRepository;
  let UserRepository;
  let SessaoLoginRepository;
  let GetConfiguracaoService;
  let ServiceUnavailableError;
  let original;
  let isProductionOriginal;

  beforeAll(async () => {
    jest.resetModules();
    // Os defaults de vida valem: o ambiente de teste não pode sobrepô-los antes do import.
    delete process.env.JWT_EXP_SECONDS;
    delete process.env.JWT_REFRESH_EXP_SECONDS;
    jest.unstable_mockModule('../../../src/InitialSetting.js', () => ({
      InitialSetting: { handle: jest.fn() }
    }));
    ({ default: Constants } = await import('../../../src/utilities/constants.js'));
    ({ LoginService } = await import('../../../src/services/auth/loginService.js'));
    ({ default: TentativaLoginRepository } = await import(
      '../../../src/repositories/tentativaLoginRepository.js'
    ));
    ({ default: UserRepository } = await import('../../../src/repositories/userRepository.js'));
    ({ default: SessaoLoginRepository } = await import(
      '../../../src/repositories/sessaoLoginRepository.js'
    ));
    ({ GetConfiguracaoService } = await import(
      '../../../src/services/configuracao/getConfiguracaoService.js'
    ));
    ({ default: ServiceUnavailableError } = await import(
      '../../../src/utilities/errors/serviceUnavailable.js'
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

  // Toda recusa/erro (401, 403, 422, 429, 503, 500) nega também o canal do cookie.
  const entrar = async () => {
    const r = await request(app)
      .post('/api/auth/login')
      .set('Origin', Constants.corsOrigins[0])
      .set('Cookie', `bls_sessao=${COOKIE_RECEBIDO}`)
      .send(CREDENCIAIS);
    if (r.status !== 200) expect(cookiesDaSessao(r)).toEqual([]);
    return r;
  };

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

  describe('login cross-site (DEC-003-017)', () => {
    const tentativas = () => TentativaLoginRepository.prototype.incrementar.mock.calls.length;

    test.each([
      ['Origin fora da lista', req => req.set('Origin', 'https://evil.example.com')],
      ['sem Origin', req => req],
      [
        'Sec-Fetch-Site cross-site com Origin listada',
        req => req.set('Origin', Constants.corsOrigins[0]).set('Sec-Fetch-Site', 'cross-site')
      ]
    ])(
      '%s: 403, nenhum bls_sessao, nenhuma tentativa consumida, serviço intocado',
      async (_n, montar) => {
        mockarSucesso();
        const req = request(app).post('/api/auth/login');
        const res = await montar(req).type('form').send(CREDENCIAIS);

        expect(res.status).toBe(403);
        expect(cookiesDaSessao(res)).toEqual([]);
        expect(res.body).not.toHaveProperty('accessToken');
        expect(tentativas()).toBe(0);
        expect(LoginService.handle).not.toHaveBeenCalled();
      }
    );

    test('mesma origem segue 200 e consome a tentativa', async () => {
      mockarSucesso();
      const res = await entrar();

      expect(res.status).toBe(200);
      expect(tentativas()).toBeGreaterThan(0);
    });
  });

  describe('credenciais fora de log e de corpo de erro', () => {
    test.each([
      ['access', AT],
      ['refresh', RT],
      ['cookie', COOKIE_RECEBIDO]
    ])('controle de detecção: a captura enxerga o sentinela de %s', (_, sentinela) => {
      const cap = capturarLog();
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
      const cap = capturarLog();

      const res = await entrar();

      expect(res.status).toBe(401);
      expect(cap.texto()).toContain('Falha de login');
      semSentinelas(cap, res);
    });

    test('429: o warn de bloqueio do limitador não carrega credenciais', async () => {
      LoginService.handle = jest.fn(async () => null);
      for (let i = 0; i < 5; i += 1) await entrar();
      const cap = capturarLog();

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
      const cap = capturarLog();

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
      const cap = capturarLog();

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
      const cap = capturarLog();

      const res = await entrar();

      expect(res.status).toBe(200);
      for (const sentinela of [AT, RT, COOKIE_RECEBIDO]) {
        expect(cap.texto()).not.toContain(sentinela);
      }
    });
  });

  describe('serviço real com a sessão persistida', () => {
    let criar;

    beforeEach(async () => {
      const senha = await hashSenha(CREDENCIAIS.senha, CUSTO_BARATO);
      jest.spyOn(UserRepository.prototype, 'selectOne').mockResolvedValue({
        id: 'u1',
        email: CREDENCIAIS.email,
        permissao: 'admin',
        senha
      });
      jest.spyOn(GetConfiguracaoService, 'handle').mockResolvedValue([{ id: 'c1' }]);
      criar = jest
        .spyOn(SessaoLoginRepository.prototype, 'criar')
        .mockResolvedValue({ id: 'sid-rota' });
      jest.spyOn(SessaoLoginRepository.prototype, 'limparDoUsuario').mockResolvedValue(0);
    });

    test('200: vida das credenciais e atributos do cookie preservados, com sid e jti', async () => {
      const res = await entrar();

      expect(res.status).toBe(200);
      expect(res.body.expiresIn).toBe(900);
      expect(res.body.tokenType).toBe('Bearer');
      expect(res.body.user).not.toHaveProperty('senha');
      expect(res.body.configuracao).toEqual({ id: 'c1' });
      expect(res.body).not.toHaveProperty('refreshToken');
      const access = parseJwt(res.body.accessToken).payload;
      expect(access.exp - access.iat).toBe(900);
      expect(access.sid).toBe('sid-rota');

      const setCookie = cookiesDaSessao(res);
      expect(setCookie).toHaveLength(1);
      expect(setCookie[0]).toContain('Max-Age=604800');
      expect(setCookie[0]).toContain('HttpOnly');
      expect(setCookie[0]).toContain('SameSite=Strict');
      expect(setCookie[0]).toContain('Path=/api/auth');
      expect(setCookie[0]).not.toContain('Secure');
      const refresh = parseJwt(setCookie[0].split(';')[0].replace('bls_sessao=', '')).payload;
      expect(refresh.sid).toBe('sid-rota');
      expect(refresh.jti).toBe(criar.mock.calls[0][0].jtiAtual);
    });

    test('503: criar rejeitando nega sem credencial, sem cookie e sem vazar a causa', async () => {
      const SENTINELA = 'SENTINELA-LOGIN-503';
      const erro = new Error(`argumentos ${SENTINELA}`);
      erro.name = 'PrismaClientKnownRequestError';
      erro.code = 'P1001';
      criar.mockRejectedValue(erro);
      const cap = capturarLog();

      const res = await entrar();

      expect(res.status).toBe(503);
      expect(res.body).toEqual({
        error: 'ServiceUnavailableError',
        message: traducao.api.errors.service_unavailable
      });
      expect(cookiesDaSessao(res)).toEqual([]);
      expect(JSON.stringify(res.body)).not.toContain(SENTINELA);
      expect(cap.texto()).toContain('Falha ao criar a sessão de login');
      expect(cap.texto()).toContain('P1001');
      expect(cap.texto()).not.toContain(SENTINELA);
    });

    test('controle de detecção: a captura enxerga o sentinela quando ele é logado', () => {
      const cap = capturarLog();
      console.error({ causa: 'SENTINELA-LOGIN-503' });
      expect(cap.texto()).toContain('SENTINELA-LOGIN-503');
    });

    test('ServiceUnavailableError é a classe que o ErrorHandler traduz em 503', () => {
      expect(new ServiceUnavailableError().message).toBe('ServiceUnavailableError');
    });
  });
});
