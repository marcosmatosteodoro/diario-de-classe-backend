import { jest } from '@jest/globals';
import request from 'supertest';
import { cookiesDaSessao } from '../../mocks/cookiesDaSessao.js';
import { capturarLog } from '../../mocks/capturaDeLog.js';
import {
  criarArmazenamentoExterno,
  instalarRegistroFalso,
  semearSessao
} from '../../mocks/sessoesEmMemoria.js';

// O import a frio da árvore de app.js chega perto do testTimeout global (10s).
const TIMEOUT_IMPORT_FRIO = 30000;

const ORIGEM = 'https://app.example.com';
const ORIGEM_FORJADA = 'https://evil.example.com';
const RENOVAR = '/api/auth/refresh-token';
const SAIR = '/api/auth/logout';
const SENTINELA = 'SENTINELA-DO-COOKIE-9f3a';

describe('renovar e sair pela sessão em cookie (app real)', () => {
  let app;
  let Constants;
  let UserRepository;
  let GetConfiguracaoService;
  let createJwt;
  let verifyJwt;
  let envOriginal;
  let corsOriginal;
  let sequencia = 0;

  beforeAll(async () => {
    jest.resetModules();
    corsOriginal = process.env.CORS_ORIGINS;
    process.env.CORS_ORIGINS = ORIGEM;
    jest.unstable_mockModule('../../../src/InitialSetting.js', () => ({
      InitialSetting: { handle: jest.fn() }
    }));
    ({ default: Constants } = await import('../../../src/utilities/constants.js'));
    ({ default: UserRepository } = await import('../../../src/repositories/userRepository.js'));
    ({ GetConfiguracaoService } = await import(
      '../../../src/services/configuracao/getConfiguracaoService.js'
    ));
    ({ createJwt } = await import('../../../src/utilities/createJwt.js'));
    ({ verifyJwt } = await import('../../../src/utilities/verifyJwt.js'));
    ({ default: app } = await import('../../../src/app.js?sessao'));
    envOriginal = Constants.env;
  }, TIMEOUT_IMPORT_FRIO);

  afterAll(() => {
    if (corsOriginal === undefined) delete process.env.CORS_ORIGINS;
    else process.env.CORS_ORIGINS = corsOriginal;
  });

  let armazenamento;
  let selectOne;
  let encerrar;
  let rotacionar;
  let configuracoes;
  const configuracao = { id: 'c1', nome: 'Config' };

  beforeEach(async () => {
    sequencia += 1;
    armazenamento = criarArmazenamentoExterno();
    ({ encerrar, rotacionar } = await instalarRegistroFalso(armazenamento));
    Constants.env = 'test';
    selectOne = jest.spyOn(UserRepository.prototype, 'selectOne').mockImplementation(async arg => ({
      id: arg.where.id,
      email: 'ana@example.com',
      permissao: 'PROFESSOR',
      nome: 'Ana'
    }));
    configuracoes = jest.spyOn(GetConfiguracaoService, 'handle').mockResolvedValue([configuracao]);
  });

  afterEach(() => {
    Constants.env = envOriginal;
    jest.restoreAllMocks();
  });

  const subDoCaso = () => `usuario-${sequencia}`;
  const sidDoCaso = () => `sid-${sequencia}`;
  const refreshDeSessao = ({
    sub = subDoCaso(),
    sid = sidDoCaso(),
    jti = 'jti-velho',
    segredo = Constants.jwtRefreshSecret,
    exp
  } = {}) =>
    createJwt(
      { sub, typ: Constants.refreshTokenType, sid, jti },
      segredo,
      exp ?? Constants.refreshExp
    );
  // Cookie de uma sessão que existe no armazenamento, do dono do caso.
  const cookieDeSessao = (jti = 'jti-velho') => {
    semearSessao(armazenamento, { sid: sidDoCaso(), idUsuario: subDoCaso(), jtiAtual: jti });
    return refreshDeSessao({ jti });
  };
  const refreshLegado = (sub = subDoCaso()) =>
    createJwt({ sub }, Constants.jwtRefreshSecret, Constants.refreshExp);

  const chamar = (rota, { cookie, origem = ORIGEM, corpo } = {}) => {
    let req = request(app).post(rota);
    if (origem !== null) req = req.set('Origin', origem);
    if (cookie !== undefined) req = req.set('Cookie', `bls_sessao=${cookie}`);
    return corpo === undefined ? req : req.send(corpo);
  };

  // Invariantes de toda resposta de renovar: o refresh nunca vai no corpo; 200 grava 1 cookie novo,
  // 401 remove 1; 403 e 500 não mexem no cookie.
  const renovar = async opcoes => {
    const res = await chamar(RENOVAR, opcoes);
    expect(JSON.stringify(res.body)).not.toContain('refreshToken');
    const cookies = cookiesDaSessao(res);
    if (res.status === 200) {
      expect(cookies).toHaveLength(1);
      expect(cookies[0].startsWith('bls_sessao=')).toBe(true);
      expect(cookies[0].startsWith('bls_sessao=;')).toBe(false);
    } else if (res.status === 401) {
      removeCookie(res);
    } else {
      expect(cookies).toEqual([]);
    }
    return res;
  };

  const removeCookie = res => {
    const cookies = cookiesDaSessao(res);
    expect(cookies).toHaveLength(1);
    expect(cookies[0].startsWith('bls_sessao=;')).toBe(true);
    expect(cookies[0]).toContain('Path=/api/auth');
    expect(cookies[0]).toContain('HttpOnly');
    expect(cookies[0]).toContain('SameSite=Strict');
    expect(cookies[0]).toMatch(/Expires=Thu, 01 Jan 1970/);
    expect(cookies[0]).not.toContain('Domain');
  };

  describe('verificação de origem (AC-002-013)', () => {
    test.each([
      ['renovar', RENOVAR],
      ['sair', SAIR]
    ])(
      '%s com origem forjada: 403, nada emitido, nenhum cookie, nada revogado',
      async (_n, rota) => {
        const cookie = cookieDeSessao();

        const res = await chamar(rota, { cookie, origem: ORIGEM_FORJADA });

        expect(res.status).toBe(403);
        expect(res.body).not.toHaveProperty('accessToken');
        expect(cookiesDaSessao(res)).toEqual([]);
        expect(selectOne).not.toHaveBeenCalled();
        expect(encerrar).not.toHaveBeenCalled();
        expect(rotacionar).not.toHaveBeenCalled();

        const legitima = await renovar({ cookie });
        expect(legitima.status).toBe(200);
      }
    );

    test.each([
      ['renovar', RENOVAR],
      ['sair', SAIR]
    ])('%s sem Origin: 403 sem cookie', async (_n, rota) => {
      const res = await chamar(rota, { cookie: cookieDeSessao(), origem: null });

      expect(res.status).toBe(403);
      expect(cookiesDaSessao(res)).toEqual([]);
      expect(selectOne).not.toHaveBeenCalled();
    });

    test('Sec-Fetch-Site cross-site com Origin listada: 403', async () => {
      const res = await chamar(RENOVAR, { cookie: cookieDeSessao() }).set(
        'Sec-Fetch-Site',
        'cross-site'
      );

      expect(res.status).toBe(403);
      expect(selectOne).not.toHaveBeenCalled();
    });
  });

  describe('renovar (AC-002-019, AC-002-012)', () => {
    test('cookie válido, sem corpo: 200 com o contrato completo e o cookie rotacionado', async () => {
      const sub = subDoCaso();

      const res = await renovar({ cookie: cookieDeSessao('jti-velho') });

      expect(res.status).toBe(200);
      const claims = verifyJwt(res.body.accessToken, Constants.jwtSecret);
      expect(claims).toMatchObject({ sub, id: sub, ver: Constants.accessTokenVersion });
      expect(res.body.tokenType).toBe('Bearer');
      expect(res.body.expiresIn).toBe(Constants.accessExp);
      expect(res.body.user).toMatchObject({ id: sub, email: 'ana@example.com' });
      expect(res.body.user).not.toHaveProperty('senha');
      expect(res.body.configuracao).toEqual(configuracao);
      expect(selectOne).toHaveBeenCalledTimes(1);
      expect(selectOne).toHaveBeenCalledWith({
        where: { id: sub },
        select: new UserRepository().selectFields
      });
      expect(cookiesDaSessao(res)).toHaveLength(1);
    });

    test('refresh legado sem a claim de tipo: 401 com remoção do cookie', async () => {
      const res = await renovar({ cookie: refreshLegado() });

      expect(res.status).toBe(401);
      removeCookie(res);
      expect(res.body).not.toHaveProperty('accessToken');
      expect(selectOne).not.toHaveBeenCalled();
    });

    test('refresh com outro valor de tipo: 401 com remoção do cookie', async () => {
      const cookie = createJwt(
        { sub: subDoCaso(), typ: 'outro' },
        Constants.jwtRefreshSecret,
        Constants.refreshExp
      );
      const res = await renovar({ cookie });

      expect(res.status).toBe(401);
      removeCookie(res);
    });

    test('sem configuração, configuracao é null', async () => {
      configuracoes.mockResolvedValue([]);

      const res = await renovar({ cookie: cookieDeSessao() });

      expect(res.status).toBe(200);
      expect(res.body.configuracao).toBeNull();
    });

    test('o corpo é ignorado', async () => {
      const cookie = cookieDeSessao();

      const res = await renovar({ cookie, corpo: { refreshToken: 'x', qualquer: 1 } });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
    });

    test('sem cookie: 401 com a mensagem traduzida e remoção do cookie', async () => {
      const res = await renovar();

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ message: 'Refresh token inválido ou expirado' });
      removeCookie(res);
    });

    test('refresh válido só no corpo: 401, repositório não chamado', async () => {
      const res = await renovar({ corpo: { refreshToken: cookieDeSessao() } });

      expect(res.status).toBe(401);
      expect(res.body).not.toHaveProperty('accessToken');
      expect(selectOne).not.toHaveBeenCalled();
      removeCookie(res);
    });

    test.each([
      ['segredo errado', () => refreshDeSessao({ segredo: 'outro-segredo-qualquer' })],
      ['vencido', () => refreshDeSessao({ exp: -10 })]
    ])('cookie %s: 401 com remoção', async (_n, gerar) => {
      const res = await renovar({ cookie: gerar() });

      expect(res.status).toBe(401);
      expect(res.body).not.toHaveProperty('accessToken');
      removeCookie(res);
    });

    test('usuário removido: 401 com remoção do cookie', async () => {
      selectOne.mockResolvedValue(null);

      const res = await renovar({ cookie: cookieDeSessao() });

      expect(res.status).toBe(401);
      expect(res.body).not.toHaveProperty('accessToken');
      removeCookie(res);
    });

    test('repositório rejeitando: 500 sem accessToken e sem set-cookie de sessão', async () => {
      const cookie = cookieDeSessao();
      selectOne.mockRejectedValue(new Error('banco fora'));

      const res = await renovar({ cookie });

      expect(res.status).toBe(500);
      expect(res.body).not.toHaveProperty('accessToken');
      expect(JSON.stringify(res.body)).not.toContain(cookie);
      expect(cookiesDaSessao(res)).toEqual([]);
    });
  });

  describe('sair (AC-004-023, AC-004-002, FR-002-017)', () => {
    test('cookie válido com jti já trocado: 204, remoção do cookie e a sessão encerrada pelo sid', async () => {
      semearSessao(armazenamento, { sid: 'sid-do-cookie', idUsuario: subDoCaso() });
      const cookie = refreshDeSessao({ sid: 'sid-do-cookie', jti: 'jti-velho' });

      const res = await chamar(SAIR, { cookie });

      expect(res.status).toBe(204);
      removeCookie(res);
      expect(encerrar).toHaveBeenCalledTimes(1);
      expect(encerrar).toHaveBeenCalledWith('sid-do-cookie', 'sair');
    });

    test.each([
      [
        'assinatura errada',
        () => refreshDeSessao({ sid: 'sid-x', jti: 'jti', segredo: 'outro-segredo' })
      ],
      ['não-JWT de 12 KB', () => 'x'.repeat(12 * 1024)],
      ['refresh legado sem sid', () => refreshLegado()]
    ])('%s: 204, cookie limpo e nenhuma sessão encerrada', async (_n, valor) => {
      const res = await chamar(SAIR, { cookie: valor() });

      expect(res.status).toBe(204);
      removeCookie(res);
      expect(encerrar).not.toHaveBeenCalled();
    });

    test('sem cookie: 204, remoção e nenhuma sessão encerrada', async () => {
      const res = await chamar(SAIR);

      expect(res.status).toBe(204);
      expect(res.body).toEqual({});
      expect(res.text).toBe('');
      removeCookie(res);
      expect(encerrar).not.toHaveBeenCalled();
    });

    test('duas vezes com o mesmo cookie: 204 e 204', async () => {
      const cookie = cookieDeSessao();

      const primeira = await chamar(SAIR, { cookie });
      const segunda = await chamar(SAIR, { cookie });

      expect(primeira.status).toBe(204);
      expect(segunda.status).toBe(204);
      removeCookie(segunda);
      expect(encerrar).toHaveBeenCalledTimes(2);
    });

    test('falha inesperada no encerramento: 500 sem set-cookie de sessão e sem sentinela no corpo', async () => {
      Constants.env = 'production-like';
      const erro = new Error('Invalid invocation SENTINELA-SAIR-500');
      erro.name = 'PrismaClientKnownRequestError';
      encerrar.mockRejectedValue(erro);

      const res = await chamar(SAIR, { cookie: cookieDeSessao() });

      expect(res.status).toBe(500);
      expect(cookiesDaSessao(res)).toEqual([]);
      expect(JSON.stringify(res.body)).not.toContain('SENTINELA-SAIR-500');
    });
  });

  describe('credencial fora de log e de corpo de erro (NFR-002-001, AC-002-018)', () => {
    test('controle de detecção: a captura enxerga o sentinela aninhado e em stdout', () => {
      const cap = capturarLog();
      console.error({ aninhado: { valor: SENTINELA } });
      process.stdout.write(`${SENTINELA}\n`);
      expect(cap.textos).toHaveLength(2);
      for (const t of cap.textos) expect(t).toContain(SENTINELA);
    });

    const erroDoOrm = () => {
      const erro = new Error(`Invalid invocation com ${SENTINELA}`);
      erro.name = 'PrismaClientKnownRequestError';
      return erro;
    };

    test('401: sem sentinela em log nem em corpo; captura ativa (controle positivo)', async () => {
      const cap = capturarLog();

      const res = await renovar({ cookie: `${SENTINELA}.x.y` });

      expect(res.status).toBe(401);
      expect(cap.textos.length).toBeGreaterThan(0);
      expect(cap.texto()).not.toContain(SENTINELA);
      expect(JSON.stringify(res.body)).not.toContain(SENTINELA);
    });

    test('403: sem sentinela em log nem em corpo; captura ativa (controle positivo)', async () => {
      const cap = capturarLog();

      const res = await chamar(RENOVAR, { cookie: SENTINELA, origem: ORIGEM_FORJADA });

      expect(res.status).toBe(403);
      expect(cap.textos.length).toBeGreaterThan(0);
      expect(cap.texto()).not.toContain(SENTINELA);
      expect(JSON.stringify(res.body)).not.toContain(SENTINELA);
    });

    test('204 (sessão encerrada): sem cookie nem sid em log ou corpo; captura ativa', async () => {
      const cap = capturarLog();
      const cookie = refreshDeSessao({ sid: `sid-${SENTINELA}`, jti: 'jti-velho' });

      const res = await chamar(SAIR, { cookie });

      expect(res.status).toBe(204);
      expect(encerrar).toHaveBeenCalledTimes(1);
      expect(cap.textos.length).toBeGreaterThan(0);
      expect(cap.texto()).not.toContain(SENTINELA);
      expect(cap.texto()).not.toContain(cookie);
      expect(res.text).not.toContain(SENTINELA);
    });

    test('204 (no-op): sem sentinela em log nem em corpo; captura ativa', async () => {
      const cap = capturarLog();

      const res = await chamar(SAIR, { cookie: SENTINELA });

      expect(res.status).toBe(204);
      expect(encerrar).not.toHaveBeenCalled();
      expect(cap.textos.length).toBeGreaterThan(0);
      expect(cap.texto()).not.toContain(SENTINELA);
      expect(res.text).not.toContain(SENTINELA);
    });

    test('sair 500 fora de development: erro do ORM fica fora do log e do corpo; log traz só o nome', async () => {
      Constants.env = 'production-like';
      encerrar.mockRejectedValue(erroDoOrm());
      const cap = capturarLog();
      const cookie = refreshDeSessao({ sid: `sid-${SENTINELA}` });

      const res = await chamar(SAIR, { cookie });

      expect(res.status).toBe(500);
      expect(cap.texto()).toContain('LogoutController');
      expect(cap.texto()).toContain('PrismaClientKnownRequestError');
      expect(cap.texto()).not.toContain(SENTINELA);
      expect(cap.texto()).not.toContain(cookie);
      expect(JSON.stringify(res.body)).not.toContain(SENTINELA);
      expect(cookiesDaSessao(res)).toEqual([]);
    });

    test('500 fora de development: erro do ORM com o sentinela fica fora do log e do corpo', async () => {
      Constants.env = 'production-like';
      selectOne.mockRejectedValue(erroDoOrm());
      const cap = capturarLog();

      const res = await renovar({ cookie: cookieDeSessao() });

      expect(res.status).toBe(500);
      expect(cap.texto()).toContain('RefreshTokenController');
      expect(cap.texto()).not.toContain(SENTINELA);
      expect(JSON.stringify(res.body)).not.toContain(SENTINELA);
      expect(res.body).not.toHaveProperty('accessToken');
    });
  });
});
