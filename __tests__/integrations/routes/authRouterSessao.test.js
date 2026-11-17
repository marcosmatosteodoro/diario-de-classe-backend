import { jest } from '@jest/globals';
import request from 'supertest';
import util from 'node:util';
import { cookiesDaSessao } from '../../mocks/cookiesDaSessao.js';

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
  let tokenRevocationManager;
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
    ({ default: tokenRevocationManager } = await import(
      '../../../src/services/auth/tokenRevocationManagerService.js'
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

  let selectOne;
  let configuracoes;
  const configuracao = { id: 'c1', nome: 'Config' };

  beforeEach(() => {
    tokenRevocationManager.clear();
    sequencia += 1;
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
    tokenRevocationManager.clear();
  });

  // `sub` próprio por caso: JWTs do mesmo `sub` no mesmo segundo são idênticos.
  const subDoCaso = () => `usuario-${sequencia}`;
  const refreshDe = (sub = subDoCaso(), segredo = Constants.jwtRefreshSecret, exp) =>
    createJwt({ sub }, segredo, exp ?? Constants.refreshExp);

  const chamar = (rota, { cookie, origem = ORIGEM, corpo } = {}) => {
    let req = request(app).post(rota);
    if (origem !== null) req = req.set('Origin', origem);
    if (cookie !== undefined) req = req.set('Cookie', `bls_sessao=${cookie}`);
    return corpo === undefined ? req : req.send(corpo);
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
        const cookie = refreshDe();

        const res = await chamar(rota, { cookie, origem: ORIGEM_FORJADA });

        expect(res.status).toBe(403);
        expect(res.body).not.toHaveProperty('accessToken');
        expect(cookiesDaSessao(res)).toEqual([]);
        expect(selectOne).not.toHaveBeenCalled();
        expect(tokenRevocationManager.getCount()).toBe(0);

        const legitima = await chamar(RENOVAR, { cookie });
        expect(legitima.status).toBe(200);
      }
    );

    test.each([
      ['renovar', RENOVAR],
      ['sair', SAIR]
    ])('%s sem Origin: 403 sem cookie', async (_n, rota) => {
      const res = await chamar(rota, { cookie: refreshDe(), origem: null });

      expect(res.status).toBe(403);
      expect(cookiesDaSessao(res)).toEqual([]);
      expect(selectOne).not.toHaveBeenCalled();
    });

    test('Sec-Fetch-Site cross-site com Origin listada: 403', async () => {
      const res = await chamar(RENOVAR, { cookie: refreshDe() }).set(
        'Sec-Fetch-Site',
        'cross-site'
      );

      expect(res.status).toBe(403);
      expect(selectOne).not.toHaveBeenCalled();
    });
  });

  describe('renovar (AC-002-019, AC-002-012)', () => {
    test('cookie válido, sem corpo: 200 com o contrato completo e nenhum cookie de sessão', async () => {
      const sub = subDoCaso();

      const res = await chamar(RENOVAR, { cookie: refreshDe(sub) });

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
      expect(cookiesDaSessao(res)).toEqual([]);
    });

    test('sem configuração, configuracao é null', async () => {
      configuracoes.mockResolvedValue([]);

      const res = await chamar(RENOVAR, { cookie: refreshDe() });

      expect(res.status).toBe(200);
      expect(res.body.configuracao).toBeNull();
    });

    test('o corpo é ignorado', async () => {
      const cookie = refreshDe();

      const res = await chamar(RENOVAR, { cookie, corpo: { refreshToken: 'x', qualquer: 1 } });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
    });

    test('sem cookie: 401 com a mensagem traduzida e remoção do cookie', async () => {
      const res = await chamar(RENOVAR);

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ message: 'Refresh token inválido ou expirado' });
      removeCookie(res);
    });

    test('refresh válido só no corpo: 401, repositório não chamado', async () => {
      const res = await chamar(RENOVAR, { corpo: { refreshToken: refreshDe() } });

      expect(res.status).toBe(401);
      expect(res.body).not.toHaveProperty('accessToken');
      expect(selectOne).not.toHaveBeenCalled();
      removeCookie(res);
    });

    test.each([
      ['segredo errado', () => refreshDe(subDoCaso(), 'outro-segredo-qualquer')],
      ['vencido', () => refreshDe(subDoCaso(), Constants.jwtRefreshSecret, -10)]
    ])('cookie %s: 401 com remoção', async (_n, gerar) => {
      const res = await chamar(RENOVAR, { cookie: gerar() });

      expect(res.status).toBe(401);
      expect(res.body).not.toHaveProperty('accessToken');
      removeCookie(res);
    });

    test('usuário removido: 401 com remoção do cookie', async () => {
      selectOne.mockResolvedValue(null);

      const res = await chamar(RENOVAR, { cookie: refreshDe() });

      expect(res.status).toBe(401);
      expect(res.body).not.toHaveProperty('accessToken');
      removeCookie(res);
    });

    test('repositório rejeitando: 500 sem accessToken e sem set-cookie de sessão', async () => {
      const cookie = refreshDe();
      selectOne.mockRejectedValue(new Error('banco fora'));

      const res = await chamar(RENOVAR, { cookie });

      expect(res.status).toBe(500);
      expect(res.body).not.toHaveProperty('accessToken');
      expect(JSON.stringify(res.body)).not.toContain(cookie);
      expect(cookiesDaSessao(res)).toEqual([]);
    });
  });

  describe('sair (AC-002-010, AC-002-011, AC-002-035)', () => {
    test('cookie válido: 204, remoção do cookie, e o mesmo cookie deixa de renovar', async () => {
      const cookie = refreshDe();

      const res = await chamar(SAIR, { cookie });

      expect(res.status).toBe(204);
      removeCookie(res);

      const depois = await chamar(RENOVAR, { cookie });
      expect(depois.status).toBe(401);
      expect(depois.body).not.toHaveProperty('accessToken');
    });

    test('duas vezes com o mesmo cookie: 204 e 204', async () => {
      const cookie = refreshDe();

      expect((await chamar(SAIR, { cookie })).status).toBe(204);
      const segunda = await chamar(SAIR, { cookie });

      expect(segunda.status).toBe(204);
      removeCookie(segunda);
    });

    test('sem cookie: 204, remoção e sem mensagem de erro', async () => {
      const res = await chamar(SAIR);

      expect(res.status).toBe(204);
      expect(res.body).toEqual({});
      expect(res.text).toBe('');
      removeCookie(res);
    });

    test('falha na revogação: 500 sem set-cookie de sessão (a saída pode ser repetida)', async () => {
      jest.spyOn(tokenRevocationManager, 'revoke').mockImplementation(() => {
        throw new Error('revogação fora');
      });

      const res = await chamar(SAIR, { cookie: refreshDe() });

      expect(res.status).toBe(500);
      expect(cookiesDaSessao(res)).toEqual([]);
    });
  });

  describe('credencial fora de log e de corpo de erro (NFR-002-001, AC-002-018)', () => {
    const METODOS = ['log', 'info', 'warn', 'error', 'debug'];

    const capturar = () => {
      const textos = [];
      for (const m of METODOS) {
        jest
          .spyOn(console, m)
          .mockImplementation((...args) =>
            textos.push(
              args
                .map(a => (typeof a === 'string' ? a : util.inspect(a, { depth: null })))
                .join(' ')
            )
          );
      }
      for (const fluxo of [process.stdout, process.stderr]) {
        jest.spyOn(fluxo, 'write').mockImplementation(chunk => {
          textos.push(String(chunk));
          return true;
        });
      }
      return { textos, texto: () => textos.join('\n') };
    };

    test('controle de detecção: a captura enxerga o sentinela aninhado e em stdout', () => {
      const cap = capturar();
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
      const cap = capturar();

      const res = await chamar(RENOVAR, { cookie: `${SENTINELA}.x.y` });

      expect(res.status).toBe(401);
      expect(cap.textos.length).toBeGreaterThan(0);
      expect(cap.texto()).not.toContain(SENTINELA);
      expect(JSON.stringify(res.body)).not.toContain(SENTINELA);
    });

    test('403: sem sentinela em log nem em corpo; captura ativa (controle positivo)', async () => {
      const cap = capturar();

      const res = await chamar(RENOVAR, { cookie: SENTINELA, origem: ORIGEM_FORJADA });

      expect(res.status).toBe(403);
      expect(cap.textos.length).toBeGreaterThan(0);
      expect(cap.texto()).not.toContain(SENTINELA);
      expect(JSON.stringify(res.body)).not.toContain(SENTINELA);
    });

    test('204: sem sentinela em log nem em corpo; captura ativa (controle positivo)', async () => {
      const cap = capturar();

      const res = await chamar(SAIR, { cookie: SENTINELA });

      expect(res.status).toBe(204);
      expect(cap.textos.length).toBeGreaterThan(0);
      expect(cap.texto()).not.toContain(SENTINELA);
      expect(res.text).not.toContain(SENTINELA);
    });

    test('500 fora de development: erro do ORM com o sentinela fica fora do log e do corpo', async () => {
      Constants.env = 'production-like';
      selectOne.mockRejectedValue(erroDoOrm());
      const cap = capturar();

      const res = await chamar(RENOVAR, { cookie: refreshDe() });

      expect(res.status).toBe(500);
      expect(cap.texto()).toContain('RefreshTokenController');
      expect(cap.texto()).not.toContain(SENTINELA);
      expect(JSON.stringify(res.body)).not.toContain(SENTINELA);
      expect(res.body).not.toHaveProperty('accessToken');
    });
  });
});
