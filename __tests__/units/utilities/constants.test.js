import { jest } from '@jest/globals';

const SEGREDO = 'sentinela-acesso-0001';
const REFRESH = 'sentinela-refresh-0002';
const NOMES = ['JWT_SECRET_TOKEN', 'JWT_REFRESH_TOKEN'];

const envOriginal = { ...process.env };

// custom-env recarregaria .env/.env.test por cima do ambiente controlado.
jest.unstable_mockModule('custom-env', () => ({
  default: { env: jest.fn() }
}));

async function carregar(env, nodeEnv) {
  jest.resetModules();
  process.env = { ...envOriginal, NODE_ENV: nodeEnv };
  NOMES.forEach(n => delete process.env[n]);
  Object.assign(process.env, env);
  return import('../../../src/utilities/constants.js');
}

afterAll(() => {
  process.env = envOriginal;
});

describe.each(['production', 'development', 'test'])('Constants com NODE_ENV=%s', nodeEnv => {
  test('lê as duas variáveis literalmente, sem derivar uma da outra', async () => {
    const { default: Constants } = await carregar(
      { JWT_SECRET_TOKEN: SEGREDO, JWT_REFRESH_TOKEN: REFRESH },
      nodeEnv
    );
    expect(Constants.jwtSecret).toBe(SEGREDO);
    expect(Constants.jwtRefreshSecret).toBe(REFRESH);
  });

  test('exige JWT_SECRET_TOKEN configurada', async () => {
    const env = { JWT_REFRESH_TOKEN: REFRESH };
    await expect(carregar(env, nodeEnv)).rejects.toThrow('JWT_SECRET_TOKEN');
    expect(process.env.JWT_SECRET_TOKEN).toBeUndefined();
    await expect(carregar(env, nodeEnv)).rejects.not.toThrow(REFRESH);
  });

  test('exige JWT_REFRESH_TOKEN configurada', async () => {
    const env = { JWT_SECRET_TOKEN: SEGREDO };
    await expect(carregar(env, nodeEnv)).rejects.toThrow('JWT_REFRESH_TOKEN');
    expect(process.env.JWT_REFRESH_TOKEN).toBeUndefined();
    await expect(carregar(env, nodeEnv)).rejects.not.toThrow(SEGREDO);
  });

  test.each(['', '   '])('valor %j equivale a ausente', async vazio => {
    await expect(
      carregar({ JWT_SECRET_TOKEN: vazio, JWT_REFRESH_TOKEN: REFRESH }, nodeEnv)
    ).rejects.toThrow('JWT_SECRET_TOKEN');
    await expect(
      carregar({ JWT_SECRET_TOKEN: SEGREDO, JWT_REFRESH_TOKEN: vazio }, nodeEnv)
    ).rejects.toThrow('JWT_REFRESH_TOKEN');
  });

  test('mensagem aponta o .env.example e não contém valores', async () => {
    const erro = await carregar({ JWT_REFRESH_TOKEN: REFRESH }, nodeEnv).catch(e => e);
    expect(erro.message).toContain('.env.example');
    expect(erro.message).not.toContain(REFRESH);
  });
});
