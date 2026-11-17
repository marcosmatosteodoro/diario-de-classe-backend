import { readFileSync } from 'node:fs';
import { setImmediate } from 'node:timers';
import { URL } from 'node:url';
import { jest } from '@jest/globals';

const construcoes = [];

jest.unstable_mockModule('../../../../src/db/generated/client/index.js', () => ({
  PrismaClient: class {
    constructor(options) {
      construcoes.push(options);
    }
    async $connect() {}
    async $disconnect() {}
  }
}));

describe('entrada do seed (seed.js)', () => {
  const seedPasswordOriginal = process.env.SEED_PASSWORD;
  let Constants;
  let isProductionOriginal;
  let exitSpy;
  let createUserSpy;

  beforeEach(async () => {
    jest.resetModules();
    construcoes.length = 0;
    ({ default: Constants } = await import('../../../../src/utilities/constants.js'));
    const { CreateUserService } = await import(
      '../../../../src/services/user/createUserService.js'
    );
    isProductionOriginal = Constants.isProduction;
    Constants.isProduction = true;
    process.env.SEED_PASSWORD = 'valor-de-teste-do-seed';
    exitSpy = jest.spyOn(process, 'exit').mockImplementation(code => {
      throw new Error(`exit:${code}`);
    });
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    createUserSpy = jest.spyOn(CreateUserService, 'handle').mockResolvedValue({});
  });

  afterEach(() => {
    Constants.isProduction = isProductionOriginal;
    if (seedPasswordOriginal === undefined) delete process.env.SEED_PASSWORD;
    else process.env.SEED_PASSWORD = seedPasswordOriginal;
    jest.restoreAllMocks();
  });

  test('em produção encerra com código 1 antes de construir o client ou criar usuário', async () => {
    await expect(import('../../../../src/db/seeds/seed.js')).rejects.toThrow('exit:1');

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(construcoes).toHaveLength(0);
    expect(createUserSpy).not.toHaveBeenCalled();
  });

  test('fora de produção constrói o client e cria usuário com a senha do ambiente', async () => {
    Constants.isProduction = false;

    await expect(import('../../../../src/db/seeds/seed.js')).resolves.toBeDefined();
    expect(construcoes).toHaveLength(1);

    await new Promise(r => setImmediate(r));

    expect(exitSpy).not.toHaveBeenCalled();
    expect(createUserSpy).toHaveBeenCalled();
    expect(createUserSpy.mock.calls[0][0].senha).toBe(process.env.SEED_PASSWORD);
  });

  test('o guard é o primeiro import de seed.js', () => {
    const primeiroImport = readFileSync(
      new URL('../../../../src/db/seeds/seed.js', import.meta.url),
      'utf8'
    )
      .split('\n')
      .filter(l => l.startsWith('import '))[0];

    expect(primeiroImport).toBe("import './guardOnLoad.js';");
  });
});
