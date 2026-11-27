import { jest } from '@jest/globals';

const NOMES = [
  'JWT_SECRET_TOKEN',
  'JWT_REFRESH_TOKEN',
  'CORS_ORIGINS',
  'RATE_LIMIT_GLOBAL',
  'RATE_LIMIT_MAX_REQUISICOES',
  'RATE_LIMIT_JANELA_SEGUNDOS'
];
const envOriginal = { ...process.env };

jest.unstable_mockModule('custom-env', () => ({
  default: { env: jest.fn() }
}));

async function carregar(env = {}) {
  jest.resetModules();
  process.env = { ...envOriginal, NODE_ENV: 'test' };
  NOMES.forEach(n => delete process.env[n]);
  Object.assign(process.env, {
    JWT_SECRET_TOKEN: 'sentinela-acesso-0001',
    JWT_REFRESH_TOKEN: 'sentinela-refresh-0002',
    CORS_ORIGINS: 'https://a.example.com',
    ...env
  });
  return (await import('../../../src/utilities/constants.js')).default;
}

afterAll(() => {
  process.env = envOriginal;
});

describe('Constants.parseRateLimitGlobal', () => {
  test('só o texto exato true liga', async () => {
    const Constants = await carregar();
    expect(Constants.parseRateLimitGlobal('true')).toBe(true);
  });

  test.each([undefined, null, '', 'TRUE', ' true', 'false', '1'])(
    'valor %p desliga',
    async valor => {
      const Constants = await carregar();
      expect(Constants.parseRateLimitGlobal(valor)).toBe(false);
    }
  );
});

describe('Constants.parseRateLimitInteiro', () => {
  test.each(['10.5', '0', '-1', 'abc', '', undefined])(
    'valor %p cai no default 300',
    async valor => {
      const Constants = await carregar();
      expect(Constants.parseRateLimitInteiro(valor)).toBe(300);
    }
  );

  test.each([
    ['1', 1],
    ['1500', 1500]
  ])('valor %p vale %p', async (valor, esperado) => {
    const Constants = await carregar();
    expect(Constants.parseRateLimitInteiro(valor)).toBe(esperado);
  });
});

describe('Constants: fiação env -> campos do limite por IP', () => {
  test('RATE_LIMIT_GLOBAL=true liga', async () => {
    const Constants = await carregar({ RATE_LIMIT_GLOBAL: 'true' });
    expect(Constants.rateLimitGlobal).toBe(true);
  });

  test('env ausente: desligado, 300 e 300', async () => {
    const Constants = await carregar();
    expect(Constants.rateLimitGlobal).toBe(false);
    expect(Constants.rateLimitMaxRequisicoes).toBe(300);
    expect(Constants.rateLimitJanelaSegundos).toBe(300);
  });

  test('RATE_LIMIT_MAX_REQUISICOES=50 chega ao campo', async () => {
    const Constants = await carregar({ RATE_LIMIT_MAX_REQUISICOES: '50' });
    expect(Constants.rateLimitMaxRequisicoes).toBe(50);
    expect(Constants.rateLimitJanelaSegundos).toBe(300);
  });

  test('RATE_LIMIT_JANELA_SEGUNDOS=45 chega ao campo', async () => {
    const Constants = await carregar({ RATE_LIMIT_JANELA_SEGUNDOS: '45' });
    expect(Constants.rateLimitJanelaSegundos).toBe(45);
    expect(Constants.rateLimitMaxRequisicoes).toBe(300);
  });
});
