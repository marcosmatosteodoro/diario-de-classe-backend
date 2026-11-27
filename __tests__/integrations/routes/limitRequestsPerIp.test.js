import { setImmediate } from 'node:timers';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { jest } from '@jest/globals';
import request from 'supertest';
import { capturarLog } from '../../mocks/capturaDeLog.js';

// O import a frio da árvore de app.js chega perto do testTimeout global (10s).
const TIMEOUT_IMPORT_FRIO = 30000;

const lerLocale = idioma =>
  JSON.parse(readFileSync(join(process.cwd(), `src/locales/${idioma}/translation.json`), 'utf8'));
const pt = lerLocale('pt');
const en = lerLocale('en');

const ORIGEM = 'https://app.example.com';
const IP_A = '203.0.113.10';
const IP_B = '203.0.113.11';
const IP_SENTINELA = '203.0.113.77';
const NOMES_ENV = [
  'RATE_LIMIT_GLOBAL',
  'RATE_LIMIT_MAX_REQUISICOES',
  'RATE_LIMIT_JANELA_SEGUNDOS',
  'TRUST_PROXY'
];

const envOriginal = { ...process.env };
let carregamentos = 0;

// Cada describe define o env, recarrega os módulos e importa o app com query única:
// Constants e TRUST_PROXY são lidos no import.
async function carregar(env) {
  jest.resetModules();
  process.env = { ...envOriginal };
  NOMES_ENV.forEach(n => delete process.env[n]);
  process.env.CORS_ORIGINS = ORIGEM;
  Object.assign(process.env, env);
  jest.unstable_mockModule('../../../src/InitialSetting.js', () => ({
    InitialSetting: { handle: jest.fn() }
  }));
  jest.unstable_mockModule('../../../src/controllers/healthController.js', () => ({
    healthCheck: jest.fn(),
    welcome: jest.fn()
  }));
  carregamentos += 1;
  const { default: app } = await import(`../../../src/app.js?rateLimit${carregamentos}`);
  const { default: Constants } = await import('../../../src/utilities/constants.js');
  const { default: TentativaLoginRepository } = await import(
    '../../../src/repositories/tentativaLoginRepository.js'
  );
  const { default: AbstractRepository } = await import(
    '../../../src/repositories/abstractRepository.js'
  );
  const { LoginService } = await import('../../../src/services/auth/loginService.js');
  const { healthCheck } = await import('../../../src/controllers/healthController.js');
  const { default: LoggerManager } = await import('../../../src/utilities/loggerManager.js');
  return {
    app,
    Constants,
    LoggerManager,
    TentativaLoginRepository,
    AbstractRepository,
    LoginService,
    healthCheck
  };
}

// Dublê atômico por chave (como o UPSERT ... RETURNING); `deslocamento` adianta o relógio.
function instalarStore(TentativaLoginRepository, healthCheck) {
  const store = new Map();
  const relogio = { deslocamento: 0 };
  const agoraReal = Date.now.bind(Date);
  const agora = () => agoraReal() + relogio.deslocamento;
  jest.spyOn(Date, 'now').mockImplementation(agora);
  const incrementar = jest
    .spyOn(TentativaLoginRepository.prototype, 'incrementar')
    .mockImplementation(async (chave, janelaSegundos) => {
      const atual = store.get(chave);
      const t = agora();
      let linha;
      if (!atual || atual.expiraEm <= t) {
        linha = { contagem: 1, expiraEm: t + janelaSegundos * 1000 };
        store.set(chave, linha);
      } else {
        atual.contagem += 1;
        linha = atual;
      }
      const resultado = {
        contagem: linha.contagem,
        segundosRestantes: Math.max(Math.ceil((linha.expiraEm - t) / 1000), 1),
        expiraEm: String(linha.expiraEm)
      };
      await new Promise(resolve => setImmediate(resolve));
      return resultado;
    });
  jest.spyOn(TentativaLoginRepository.prototype, 'decrementar').mockResolvedValue(1);
  healthCheck.mockImplementation((req, res) => res.status(200).json({ ok: true }));
  return { store, relogio, incrementar };
}

const globais = incrementar =>
  incrementar.mock.calls.filter(([chave]) => chave.startsWith('global:'));

const STATUS_PASSA = [200, 401];

describe('limite por IP desligado (app real)', () => {
  let ctx;
  let dubles;

  beforeAll(async () => {
    ctx = await carregar({});
  }, TIMEOUT_IMPORT_FRIO);

  afterAll(() => {
    process.env = envOriginal;
  });

  beforeEach(() => {
    dubles = instalarStore(ctx.TentativaLoginRepository, ctx.healthCheck);
  });

  test('sem a flag, 10 requisições a cada rota seguem sem tocar o contador', async () => {
    for (let i = 0; i < 10; i += 1) {
      expect((await request(ctx.app).get('/api/alunos')).status).toBe(401);
      expect((await request(ctx.app).get('/api/health')).status).toBe(200);
    }
    expect(dubles.incrementar).toHaveBeenCalledTimes(0);
  });
});

describe('limite por IP ligado (app real)', () => {
  let ctx;
  let dubles;

  beforeAll(async () => {
    ctx = await carregar({
      RATE_LIMIT_GLOBAL: 'true',
      RATE_LIMIT_MAX_REQUISICOES: '5',
      RATE_LIMIT_JANELA_SEGUNDOS: '60'
    });
  }, TIMEOUT_IMPORT_FRIO);

  afterAll(() => {
    process.env = envOriginal;
  });

  beforeEach(() => {
    dubles = instalarStore(ctx.TentativaLoginRepository, ctx.healthCheck);
  });

  const estourar = async () => {
    for (let i = 0; i < 5; i += 1) {
      expect(STATUS_PASSA).toContain((await request(ctx.app).get('/api/alunos')).status);
    }
  };

  test('cada requisição soma uma chamada ao contador e nenhuma leitura prévia', async () => {
    const selectOne = jest.spyOn(ctx.AbstractRepository.prototype, 'selectOne');
    const selectMany = jest.spyOn(ctx.AbstractRepository.prototype, 'selectMany');
    const rotas = ['/api/health', '/api/alunos', '/api/health', '/api/alunos'];

    for (const rota of rotas) await request(ctx.app).get(rota);

    expect(dubles.incrementar).toHaveBeenCalledTimes(rotas.length);
    expect(selectOne).toHaveBeenCalledTimes(0);
    expect(selectMany).toHaveBeenCalledTimes(0);
  });

  test('a requisição seguinte ao limite recebe 429 com Retry-After e mensagem nos dois idiomas', async () => {
    await estourar();

    const emPt = await request(ctx.app).get('/api/alunos').set('Accept-Language', 'pt');
    const ultimo = await dubles.incrementar.mock.results.at(-1).value;

    expect(emPt.status).toBe(429);
    expect(emPt.headers['retry-after']).toBe(String(ultimo.segundosRestantes));
    expect(emPt.body).toEqual({
      message: pt.api.errors.too_many_requests.replace('{{segundos}}', ultimo.segundosRestantes)
    });

    const emEn = await request(ctx.app).get('/api/alunos').set('Accept-Language', 'en');
    const ultimoEn = await dubles.incrementar.mock.results.at(-1).value;
    expect(emEn.status).toBe(429);
    expect(emEn.body).toEqual({
      message: en.api.errors.too_many_requests.replace('{{segundos}}', ultimoEn.segundosRestantes)
    });
  });

  test('a recusa não executa a rota pedida', async () => {
    await estourar();
    const rota = await request(ctx.app).get('/api/health');
    expect(rota.status).toBe(429);
    expect(ctx.healthCheck).toHaveBeenCalledTimes(0);
  });

  test('rajada recusada gera uma única linha de log', async () => {
    const aviso = jest.spyOn(console, 'warn').mockImplementation(() => {});
    await estourar();

    for (let i = 0; i < 3; i += 1) {
      expect((await request(ctx.app).get('/api/alunos')).status).toBe(429);
    }

    const linhas = aviso.mock.calls.filter(args => String(args[0]).includes('rate_limit.bloqueio'));
    expect(linhas).toHaveLength(1);
  });

  test('janela vencida reinicia a contagem', async () => {
    await estourar();
    expect((await request(ctx.app).get('/api/alunos')).status).toBe(429);

    dubles.relogio.deslocamento = ctx.Constants.rateLimitJanelaSegundos * 1000 + 1000;
    const depois = await request(ctx.app).get('/api/alunos');

    expect(STATUS_PASSA).toContain(depois.status);
    expect((await dubles.incrementar.mock.results.at(-1).value).contagem).toBe(1);
  });

  test('preflight não soma ao contador e não consome o limite', async () => {
    for (let i = 0; i < 7; i += 1) {
      const r = await request(ctx.app)
        .options('/api/auth/login')
        .set('Origin', ORIGEM)
        .set('Access-Control-Request-Method', 'POST');
      expect(r.status).toBe(204);
    }
    expect(dubles.incrementar).toHaveBeenCalledTimes(0);

    expect(STATUS_PASSA).toContain((await request(ctx.app).get('/api/alunos')).status);
  });

  test('armazenamento indisponível responde 503 sem executar a rota', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    dubles.incrementar.mockRejectedValue(new Error('indisponível'));

    const r = await request(ctx.app).get('/api/health').set('Accept-Language', 'pt');

    expect(r.status).toBe(503);
    expect(r.body).toEqual({ message: pt.api.errors.service_unavailable });
    expect(ctx.healthCheck).toHaveBeenCalledTimes(0);
  });

  test('controle positivo: com o armazenamento disponível a rota executa uma vez', async () => {
    const r = await request(ctx.app).get('/api/health');

    expect(r.status).toBe(200);
    expect(ctx.healthCheck).toHaveBeenCalledTimes(1);
  });
});

describe('limite por IP com a flag alternada na mesma importação', () => {
  let ctx;
  let dubles;

  beforeAll(async () => {
    ctx = await carregar({ RATE_LIMIT_GLOBAL: 'true' });
  }, TIMEOUT_IMPORT_FRIO);

  afterAll(() => {
    process.env = envOriginal;
  });

  beforeEach(() => {
    dubles = instalarStore(ctx.TentativaLoginRepository, ctx.healthCheck);
  });

  test('a flag é lida a cada requisição', async () => {
    jest.replaceProperty(ctx.Constants, 'rateLimitGlobal', false);
    for (let i = 0; i < 3; i += 1) await request(ctx.app).get('/api/health');
    expect(dubles.incrementar).toHaveBeenCalledTimes(0);

    jest.replaceProperty(ctx.Constants, 'rateLimitGlobal', true);
    for (let i = 0; i < 3; i += 1) await request(ctx.app).get('/api/health');
    expect(dubles.incrementar).toHaveBeenCalledTimes(3);
  });
});

describe.each([
  ['?rateLimitDefaults (variáveis ausentes)', {}],
  [
    '?rateLimitDefaultsInvalidos (valores inválidos)',
    {
      RATE_LIMIT_MAX_REQUISICOES: 'abc',
      RATE_LIMIT_JANELA_SEGUNDOS: '10.5'
    }
  ]
])('limite por IP com valores padrão %s', (_nome, extra) => {
  let ctx;
  let dubles;

  beforeAll(async () => {
    ctx = await carregar({ RATE_LIMIT_GLOBAL: 'true', ...extra });
  }, TIMEOUT_IMPORT_FRIO);

  afterAll(() => {
    process.env = envOriginal;
  });

  beforeEach(() => {
    dubles = instalarStore(ctx.TentativaLoginRepository, ctx.healthCheck);
  });

  test('cai em 300/300 e uma jornada de 20 requisições não é recusada', async () => {
    expect(ctx.Constants.rateLimitMaxRequisicoes).toBe(300);
    expect(ctx.Constants.rateLimitJanelaSegundos).toBe(300);

    for (let i = 0; i < 20; i += 1) {
      const r = await request(ctx.app).get(i % 2 ? '/api/alunos' : '/api/health');
      expect(STATUS_PASSA).toContain(r.status);
    }
    expect(dubles.incrementar).toHaveBeenCalledTimes(20);
  });
});

describe('limite por IP atrás de proxy confiável (?rateLimitProxy)', () => {
  let ctx;
  let dubles;

  beforeAll(async () => {
    ctx = await carregar({
      TRUST_PROXY: '1',
      RATE_LIMIT_GLOBAL: 'true',
      RATE_LIMIT_MAX_REQUISICOES: '5',
      RATE_LIMIT_JANELA_SEGUNDOS: '60'
    });
  }, TIMEOUT_IMPORT_FRIO);

  afterAll(() => {
    process.env = envOriginal;
  });

  beforeEach(() => {
    dubles = instalarStore(ctx.TentativaLoginRepository, ctx.healthCheck);
  });

  const de = (ip, rota = '/api/alunos') => request(ctx.app).get(rota).set('X-Forwarded-For', ip);

  test('o log da recusa traz método, rota e limite, sem o ip', async () => {
    const captura = capturarLog();
    for (let i = 0; i < 6; i += 1) await de(IP_SENTINELA);

    const bloqueios = () => captura.textos.filter(t => t.includes('rate_limit.bloqueio'));
    const linhaDoBloqueio = bloqueios().join('\n');
    expect(bloqueios()).toHaveLength(1);
    expect(linhaDoBloqueio).toContain('GET');
    expect(linhaDoBloqueio).toContain('/api/alunos');
    expect(linhaDoBloqueio).toMatch(/limite: 5/);
    expect(linhaDoBloqueio).not.toContain(IP_SENTINELA);

    ctx.LoggerManager.warn('rate_limit.bloqueio', { ip: IP_SENTINELA });
    expect(bloqueios().join('\n')).toContain(IP_SENTINELA);
  });

  test('um ip recebe exatamente as recusas que excedem o limite e o outro nenhuma', async () => {
    const statusA = [];
    const statusB = [];
    for (let i = 0; i < 8; i += 1) {
      statusA.push((await de(IP_A)).status);
      // B fica dentro do próprio limite (5): só o isolamento entre origens está em prova.
      if (i < 5) statusB.push((await de(IP_B)).status);
    }

    expect(statusA.filter(s => s === 429)).toHaveLength(3);
    expect(statusB.filter(s => s === 429)).toHaveLength(0);
    expect(statusB.every(s => STATUS_PASSA.includes(s))).toBe(true);
  });

  test('cabeçalho forjado à esquerda não muda a origem contada', async () => {
    const statuses = [];
    for (let i = 0; i < 6; i += 1) {
      statuses.push((await de(`198.51.100.${i + 1}, 203.0.113.7`)).status);
    }

    expect(statuses.slice(0, 5).every(s => STATUS_PASSA.includes(s))).toBe(true);
    expect(statuses[5]).toBe(429);
    expect(new Set(globais(dubles.incrementar).map(([chave]) => chave))).toEqual(
      new Set(['global:203.0.113.7'])
    );
  });
});

describe('limite por IP convivendo com o limite de login (?rateLimitLogin)', () => {
  let ctx;
  let dubles;

  beforeAll(async () => {
    ctx = await carregar({
      RATE_LIMIT_GLOBAL: 'true',
      RATE_LIMIT_MAX_REQUISICOES: '1000',
      RATE_LIMIT_JANELA_SEGUNDOS: '60'
    });
  }, TIMEOUT_IMPORT_FRIO);

  afterAll(() => {
    process.env = envOriginal;
  });

  beforeEach(() => {
    dubles = instalarStore(ctx.TentativaLoginRepository, ctx.healthCheck);
    jest.spyOn(ctx.LoginService, 'handle').mockResolvedValue(null);
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  const entrar = () =>
    request(ctx.app)
      .post('/api/auth/login')
      .set('Origin', ORIGEM)
      .set('Accept-Language', 'pt')
      .send({ email: 'maria@example.com', senha: 'errada' });

  test('a mesma tentativa soma nas duas contagens e o 429 do login permanece', async () => {
    const limite = ctx.Constants.loginMaxTentativasPorEmail;
    for (let i = 0; i < limite; i += 1) expect((await entrar()).status).toBe(401);

    const bloqueada = await entrar();

    expect(bloqueada.status).toBe(429);
    expect(bloqueada.body).toEqual({ message: pt.auth.login.too_many_attempts });
    const chamadasGlobais = globais(dubles.incrementar);
    expect(chamadasGlobais).toHaveLength(limite + 1);
    const chaveGlobal = chamadasGlobais[0][0];
    expect(dubles.store.get(chaveGlobal)?.contagem).toBe(6);
  });
});
