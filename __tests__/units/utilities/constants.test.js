import { jest } from '@jest/globals';

const SEGREDO = 'sentinela-acesso-0001';
const REFRESH = 'sentinela-refresh-0002';
const NOMES = [
  'JWT_SECRET_TOKEN',
  'JWT_REFRESH_TOKEN',
  'CORS_ORIGINS',
  'JWT_EXP_SECONDS',
  'JWT_REFRESH_EXP_SECONDS'
];
const ORIGENS = 'https://a.example.com,http://localhost:3001';

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

const comOrigens = env => ({ CORS_ORIGINS: ORIGENS, ...env });

afterAll(() => {
  process.env = envOriginal;
});

describe.each(['production', 'development', 'test'])('Constants com NODE_ENV=%s', nodeEnv => {
  test('lê as duas variáveis literalmente, sem derivar uma da outra', async () => {
    const { default: Constants } = await carregar(
      comOrigens({ JWT_SECRET_TOKEN: SEGREDO, JWT_REFRESH_TOKEN: REFRESH }),
      nodeEnv
    );
    expect(Constants.jwtSecret).toBe(SEGREDO);
    expect(Constants.jwtRefreshSecret).toBe(REFRESH);
  });

  test('exige JWT_SECRET_TOKEN configurada', async () => {
    const env = comOrigens({ JWT_REFRESH_TOKEN: REFRESH });
    await expect(carregar(env, nodeEnv)).rejects.toThrow('JWT_SECRET_TOKEN');
    expect(process.env.JWT_SECRET_TOKEN).toBeUndefined();
    await expect(carregar(env, nodeEnv)).rejects.not.toThrow(REFRESH);
  });

  test('exige JWT_REFRESH_TOKEN configurada', async () => {
    const env = comOrigens({ JWT_SECRET_TOKEN: SEGREDO });
    await expect(carregar(env, nodeEnv)).rejects.toThrow('JWT_REFRESH_TOKEN');
    expect(process.env.JWT_REFRESH_TOKEN).toBeUndefined();
    await expect(carregar(env, nodeEnv)).rejects.not.toThrow(SEGREDO);
  });

  test.each(['', '   '])('valor %j equivale a ausente', async vazio => {
    await expect(
      carregar(comOrigens({ JWT_SECRET_TOKEN: vazio, JWT_REFRESH_TOKEN: REFRESH }), nodeEnv)
    ).rejects.toThrow('JWT_SECRET_TOKEN');
    await expect(
      carregar(comOrigens({ JWT_SECRET_TOKEN: SEGREDO, JWT_REFRESH_TOKEN: vazio }), nodeEnv)
    ).rejects.toThrow('JWT_REFRESH_TOKEN');
  });

  test('mensagem aponta o .env.example e não contém valores', async () => {
    const erro = await carregar(comOrigens({ JWT_REFRESH_TOKEN: REFRESH }), nodeEnv).catch(e => e);
    expect(erro.message).toContain('.env.example');
    expect(erro.message).not.toContain(REFRESH);
  });
});

describe('parseCorsOrigins', () => {
  let parseCorsOrigins;

  beforeAll(async () => {
    ({ parseCorsOrigins } = await carregar(
      comOrigens({ JWT_SECRET_TOKEN: SEGREDO, JWT_REFRESH_TOKEN: REFRESH }),
      'test'
    ));
  });

  test.each([undefined, '', '   ', ' , ,'])(
    'produção com %j lança nomeando CORS_ORIGINS',
    vazio => {
      expect(() => parseCorsOrigins(vazio, true)).toThrow('CORS_ORIGINS');
    }
  );

  test.each([
    '*',
    'https://*.example.com',
    'https://a.example.com:*',
    'https://a.example.com/',
    'https://a.example.com/x',
    'ftp://a.example.com',
    'nao-e-url'
  ])('entrada inválida %j lança nomeando CORS_ORIGINS', invalida => {
    expect(() => parseCorsOrigins(invalida, false)).toThrow('CORS_ORIGINS');
    expect(() => parseCorsOrigins(`http://localhost:3001,${invalida}`, true)).toThrow(
      'CORS_ORIGINS'
    );
  });

  test('wildcard em subdomínio é recusado com a mensagem de origem inválida', () => {
    expect(() => parseCorsOrigins('https://*.example.com', true)).toThrow(
      'A variável de ambiente CORS_ORIGINS deve conter apenas origens exatas (esquema://host[:porta], sem caminho, barra final ou *) (veja o .env.example).'
    );
  });

  test('normaliza espaços e preserva a ordem', () => {
    expect(parseCorsOrigins(' https://a.example.com , http://localhost:3001 ', true)).toEqual([
      'https://a.example.com',
      'http://localhost:3001'
    ]);
  });

  test.each([undefined, '', '  '])('fora de produção com %j usa o padrão de dev', vazio => {
    expect(parseCorsOrigins(vazio, false)).toEqual(['http://localhost:3001']);
  });
});

describe('Constants.corsOrigins', () => {
  test('reflete o CORS_ORIGINS carregado', async () => {
    const { default: Constants } = await carregar(
      {
        JWT_SECRET_TOKEN: SEGREDO,
        JWT_REFRESH_TOKEN: REFRESH,
        CORS_ORIGINS: ' https://a.example.com,https://b.example.com '
      },
      'production'
    );
    expect(Constants.corsOrigins).toEqual(['https://a.example.com', 'https://b.example.com']);
  });

  test('produção sem CORS_ORIGINS derruba o carregamento', async () => {
    await expect(
      carregar({ JWT_SECRET_TOKEN: SEGREDO, JWT_REFRESH_TOKEN: REFRESH }, 'production')
    ).rejects.toThrow('CORS_ORIGINS');
  });
});

describe('Constants — validade da sessão e cookie', () => {
  const base = comOrigens({ JWT_SECRET_TOKEN: SEGREDO, JWT_REFRESH_TOKEN: REFRESH });

  test('sem env, accessExp é 900 e refreshExp é 604800', async () => {
    const { default: Constants } = await carregar(base, 'test');
    expect(process.env.JWT_EXP_SECONDS).toBeUndefined();
    expect(process.env.JWT_REFRESH_EXP_SECONDS).toBeUndefined();
    expect(Constants.accessExp).toBe(900);
    expect(Constants.refreshExp).toBe(604800);
  });

  test('JWT_EXP_SECONDS define accessExp e não mexe em refreshExp', async () => {
    const { default: Constants } = await carregar({ ...base, JWT_EXP_SECONDS: '120' }, 'test');
    expect(Constants.accessExp).toBe(120);
    expect(Constants.refreshExp).toBe(604800);
  });

  test('JWT_REFRESH_EXP_SECONDS define refreshExp e não mexe em accessExp', async () => {
    const { default: Constants } = await carregar(
      { ...base, JWT_REFRESH_EXP_SECONDS: '240' },
      'test'
    );
    expect(Constants.refreshExp).toBe(240);
    expect(Constants.accessExp).toBe(900);
  });

  test('sessionCookie é literalmente o nome e o path combinados e a versão do access é 2', async () => {
    const { default: Constants } = await carregar(base, 'test');
    expect(Constants.sessionCookie).toEqual({ name: 'bls_sessao', path: '/api/auth' });
    expect(Constants.accessTokenVersion).toBe(2);
  });
});
