import { jest } from '@jest/globals';

const NOMES = [
  'JWT_SECRET_TOKEN',
  'JWT_REFRESH_TOKEN',
  'CORS_ORIGINS',
  'DEMO_MODE',
  'DEMO_CONTAS_FIXAS'
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

describe('Constants.parseDemoMode', () => {
  test('só o texto exato true liga', async () => {
    const Constants = await carregar();
    expect(Constants.parseDemoMode('true')).toBe(true);
  });

  test.each([undefined, null, '', '   ', '1', 'TRUE', 'True', ' true', 'true ', 'false', 'yes'])(
    'valor %p desliga',
    async valor => {
      const Constants = await carregar();
      expect(Constants.parseDemoMode(valor)).toBe(false);
    }
  );
});

describe('Constants.parseDemoContasFixas', () => {
  test.each([undefined, null, 42, '', '   ', ',,'])('valor %p vira []', async valor => {
    const Constants = await carregar();
    expect(Constants.parseDemoContasFixas(valor)).toEqual([]);
  });

  test('separa por vírgula, apara espaços, descarta vazios e preserva a caixa', async () => {
    const Constants = await carregar();
    expect(Constants.parseDemoContasFixas('A@Example.com, b@example.com ,,c@example.com')).toEqual([
      'A@Example.com',
      'b@example.com',
      'c@example.com'
    ]);
  });
});

describe('Constants: fiação env -> campos', () => {
  test('DEMO_MODE=true liga', async () => {
    const Constants = await carregar({ DEMO_MODE: 'true' });
    expect(Constants.demoMode).toBe(true);
  });

  test('env ausente: demoMode false e demoContasFixas []', async () => {
    const Constants = await carregar();
    expect(Constants.demoMode).toBe(false);
    expect(Constants.demoContasFixas).toEqual([]);
  });

  test("DEMO_MODE='TRUE' não liga", async () => {
    const Constants = await carregar({ DEMO_MODE: 'TRUE' });
    expect(Constants.demoMode).toBe(false);
  });

  test('DEMO_CONTAS_FIXAS chega como lista', async () => {
    const Constants = await carregar({ DEMO_CONTAS_FIXAS: 'fixa@example.com' });
    expect(Constants.demoContasFixas).toEqual(['fixa@example.com']);
  });
});
