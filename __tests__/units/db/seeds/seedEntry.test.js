import { jest } from '@jest/globals';

const construcoes = [];

jest.unstable_mockModule('../../../../src/db/generated/client/index.js', () => ({
  PrismaClient: class {
    constructor(options) {
      construcoes.push(options);
    }
  }
}));

const { default: Constants } = await import('../../../../src/utilities/constants.js');
const { CreateUserService } = await import('../../../../src/services/user/createUserService.js');

describe('entrada do seed (seed.js)', () => {
  const isProductionOriginal = Constants.isProduction;
  const seedPasswordOriginal = process.env.SEED_PASSWORD;
  let exitSpy;
  let createUserSpy;

  beforeEach(() => {
    construcoes.length = 0;
    Constants.isProduction = true;
    process.env.SEED_PASSWORD = 'valor-de-teste-do-seed';
    exitSpy = jest.spyOn(process, 'exit').mockImplementation(code => {
      throw new Error(`exit:${code}`);
    });
    jest.spyOn(console, 'error').mockImplementation(() => {});
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
});
