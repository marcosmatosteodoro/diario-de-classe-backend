import { jest } from '@jest/globals';
import request from 'supertest';
import { capturarLog } from '../../mocks/capturaDeLog.js';
import { refreshDeSessao, sidDe, tokenDe } from '../../mocks/accessDeTeste.js';
import {
  criarArmazenamentoExterno,
  instalarRegistroFalso,
  semearSessao
} from '../../mocks/sessoesEmMemoria.js';

// O import a frio da árvore de app.js chega perto do testTimeout global (10s).
const TIMEOUT_IMPORT_FRIO = 30000;

const SENHA = 'SENHA-SENTINELA';
const EMAIL = 'sentinela@example.com';
const TERMO = 'TERMO-SENTINELA';
const COOKIE = 'COOKIE-SENTINELA';
const AT = 'AT-SENTINELA';
const RT = 'RT-SENTINELA';
const IP = '::ffff:127.0.0.1';

describe('trilha de auditoria de autenticação (app real, modo produção)', () => {
  let app;
  let Constants;
  let LoginService;
  let LoggerManager;
  let TentativaLoginRepository;
  let armazenamento;
  let loginOriginal;
  let isProductionOriginal;

  beforeAll(async () => {
    jest.resetModules();
    jest.unstable_mockModule('../../../src/InitialSetting.js', () => ({
      InitialSetting: { handle: jest.fn() }
    }));
    ({ default: Constants } = await import('../../../src/utilities/constants.js'));
    ({ default: LoggerManager } = await import('../../../src/utilities/loggerManager.js'));
    ({ LoginService } = await import('../../../src/services/auth/loginService.js'));
    ({ default: TentativaLoginRepository } = await import(
      '../../../src/repositories/tentativaLoginRepository.js'
    ));
    loginOriginal = LoginService.handle;
    isProductionOriginal = Constants.isProduction;
    // Modo produção vale durante todo o describe: o access log escolhe o formato na montagem do app
    // e os eventos de auth decidem por Constants.isProduction a cada requisição.
    Constants.isProduction = true;
    ({ default: app } = await import('../../../src/app.js?trilha'));
  }, TIMEOUT_IMPORT_FRIO);

  beforeEach(async () => {
    armazenamento = criarArmazenamentoExterno();
    await instalarRegistroFalso(armazenamento);
    jest.spyOn(TentativaLoginRepository.prototype, 'incrementar').mockResolvedValue({
      contagem: 1,
      segundosRestantes: 900,
      expiraEm: '1'
    });
    jest.spyOn(TentativaLoginRepository.prototype, 'decrementar').mockResolvedValue(1);
    jest
      .spyOn(TentativaLoginRepository.prototype, 'removerPorChave')
      .mockResolvedValue({ count: 1 });
  });

  afterEach(() => {
    LoginService.handle = loginOriginal;
    jest.restoreAllMocks();
  });

  afterAll(() => {
    Constants.isProduction = isProductionOriginal;
  });

  // Access com a claim `sid` da sessão semeada no registro em memória: o `isLoggedIn` exige sessão viva.
  const accessDe = (role, id = 'p1') => {
    semearSessao(armazenamento, { sid: sidDe(id), idUsuario: id });
    return tokenDe({ id, role });
  };

  const semSentinelas = cap => {
    for (const sentinela of [SENHA, EMAIL, TERMO, COOKIE, AT, RT]) {
      expect(cap.texto()).not.toContain(sentinela);
    }
  };

  const linhasComEvento = (cap, evento) => cap.textos.filter(t => t.includes(evento));

  test('controle de detecção: a captura enxerga um sentinela passado ao logger', () => {
    const cap = capturarLog();
    LoggerManager.warn('auth.acesso_negado', { rota: `/api/x?q=${TERMO}`, email: EMAIL });
    expect(cap.texto()).toContain(TERMO);
    expect(cap.texto()).toContain(EMAIL);
  });

  test('401 sem token: uma linha de negação, sem a query', async () => {
    const cap = capturarLog();

    const res = await request(app).get(`/api/alunos?busca=${TERMO}&email=${EMAIL}`);

    expect(Constants.isProduction).toBe(true);
    expect(res.status).toBe(401);
    const linhas = linhasComEvento(cap, 'auth.acesso_negado');
    expect(linhas).toHaveLength(1);
    expect(linhas[0]).toContain('[WARN]');
    expect(linhas[0]).toContain('status: 401');
    expect(linhas[0]).toContain("metodo: 'GET'");
    expect(linhas[0]).toContain("rota: '/api/alunos'");
    expect(linhas[0]).toContain('userId: null');
    expect(linhas[0]).toContain(`ip: '${IP}'`);
    semSentinelas(cap);
  });

  test('403 em rota de admin com token válido de professor: linha com userId', async () => {
    const cap = capturarLog();
    const token = accessDe('professor', 'p1');

    const res = await request(app)
      .get(`/api/professores?busca=${TERMO}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    const linhas = linhasComEvento(cap, 'auth.acesso_negado');
    expect(linhas).toHaveLength(1);
    expect(linhas[0]).toContain('status: 403');
    expect(linhas[0]).toContain("rota: '/api/professores'");
    expect(linhas[0]).toContain("userId: 'p1'");
    expect(cap.texto()).not.toContain(token);
    semSentinelas(cap);
  });

  test('401 de sessão encerrada com access ainda dentro da validade: linha de negação', async () => {
    const token = accessDe('professor', 'p1');
    armazenamento.sessoes.get(sidDe('p1')).encerrada = true;
    const cap = capturarLog();

    const res = await request(app).get('/api/professores').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(401);
    const linhas = linhasComEvento(cap, 'auth.acesso_negado');
    expect(linhas).toHaveLength(1);
    expect(linhas[0]).toContain('status: 401');
    expect(cap.texto()).not.toContain(token);
  });

  test('403 de origem cruzada no login: linha de negação', async () => {
    const cap = capturarLog();

    const res = await request(app)
      .post('/api/auth/login')
      .set('Origin', 'https://evil.example.com')
      .send({ email: EMAIL, senha: SENHA });

    expect(res.status).toBe(403);
    expect(linhasComEvento(cap, 'auth.acesso_negado')).toHaveLength(1);
    semSentinelas(cap);
  });

  test('resposta 200 não gera linha de negação', async () => {
    const cap = capturarLog();

    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(linhasComEvento(cap, 'auth.acesso_negado')).toHaveLength(0);
  });

  test('login ok: linha com userId e ip, sem credenciais', async () => {
    LoginService.handle = jest.fn(async () => ({
      accessToken: AT,
      refreshToken: RT,
      tokenType: 'Bearer',
      expiresIn: 900,
      user: { id: 'u1', email: EMAIL },
      configuracao: { id: 'c1' }
    }));
    const cap = capturarLog();

    const res = await request(app)
      .post('/api/auth/login')
      .set('Origin', Constants.corsOrigins[0])
      .set('Cookie', `bls_sessao=${COOKIE}`)
      .send({ email: EMAIL, senha: SENHA });

    expect(res.status).toBe(200);
    const linhas = linhasComEvento(cap, 'auth.login.ok');
    expect(linhas).toHaveLength(1);
    expect(linhas[0]).toContain('[INFO]');
    expect(linhas[0]).toContain("userId: 'u1'");
    expect(linhas[0]).toContain(`ip: '${IP}'`);
    semSentinelas(cap);
  });

  test('logout: linha com revogado e ip, sem o valor do cookie', async () => {
    semearSessao(armazenamento, { sid: sidDe('u1'), idUsuario: 'u1' });
    const refresh = refreshDeSessao({ sub: 'u1', sid: sidDe('u1'), jti: 'jti-atual-de-teste' });
    const cap = capturarLog();

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Origin', Constants.corsOrigins[0])
      .set('Cookie', `bls_sessao=${refresh}`);

    expect(res.status).toBe(204);
    const linhas = linhasComEvento(cap, 'auth.logout');
    expect(linhas).toHaveLength(1);
    expect(linhas[0]).toContain('revogado: true');
    expect(linhas[0]).toContain(`ip: '${IP}'`);
    expect(cap.texto()).not.toContain(refresh);
    semSentinelas(cap);
  });

  test('access log de produção: uma linha por requisição, sem query nem referrer', async () => {
    const cap = capturarLog();

    await request(app)
      .get(`/api/alunos?busca=${TERMO}&email=${EMAIL}`)
      .set('Referer', `https://ref.example.com/?q=${TERMO}`)
      .set('Authorization', `Bearer ${AT}`);

    const linhas = linhasComEvento(cap, '[EXPRESS]');
    expect(linhas).toHaveLength(1);
    expect(linhas[0]).toContain('"GET /api/alunos" 401');
    expect(cap.texto()).not.toContain('ref.example.com');
    semSentinelas(cap);
  });
});
