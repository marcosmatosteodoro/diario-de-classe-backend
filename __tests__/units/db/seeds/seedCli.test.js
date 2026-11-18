import { readFileSync } from 'node:fs';
import { URL } from 'node:url';
import { jest } from '@jest/globals';
import { capturarLog } from '../../../mocks/capturaDeLog.js';

const CAMINHO_CLIENT = '../../../../src/db/generated/client/index.js';
const CAMINHO_ETAPAS = '../../../../src/db/seeds/seedEtapas.js';
const CAMINHO_SEED = '../../../../src/db/seeds/seed.js';
const CAMINHO_CLI = '../../../../src/db/seeds/seedCli.js';
const CAMINHO_PRISMA = '../../../../src/db/prisma.js';

const SENHA = 'valor-de-teste-do-seed';

describe('linha de comando do seed (seedCli.js)', () => {
  const seedPasswordOriginal = process.env.SEED_PASSWORD;
  const construcoes = [];
  let Constants;
  let isProductionOriginal;
  let exitSpy;
  let createUserSpy;
  let disconnectSpy;

  const mockarClient = () =>
    jest.unstable_mockModule(CAMINHO_CLIENT, () => ({
      PrismaClient: class {
        constructor(options) {
          construcoes.push(options);
        }
        async $connect() {}
        async $disconnect() {}
      }
    }));

  beforeEach(async () => {
    jest.resetModules();
    construcoes.length = 0;
    // O registro de mocks sobrevive ao resetModules: o que um caso mocka não vaza para o seguinte.
    jest.unstable_unmockModule(CAMINHO_SEED);
    jest.unstable_unmockModule(CAMINHO_ETAPAS);
    mockarClient();
    disconnectSpy = jest.fn(async () => {});
    jest.unstable_mockModule(CAMINHO_PRISMA, () => ({ default: { $disconnect: disconnectSpy } }));
    ({ default: Constants } = await import('../../../../src/utilities/constants.js'));
    const { CreateUserService } = await import(
      '../../../../src/services/user/createUserService.js'
    );
    isProductionOriginal = Constants.isProduction;
    Constants.isProduction = false;
    process.env.SEED_PASSWORD = SENHA;
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

  test('em produção encerra com código 1 sem chamar o seed, construir o client ou criar usuário', async () => {
    Constants.isProduction = true;
    const handle = jest.fn(async () => ({}));
    jest.unstable_mockModule(CAMINHO_SEED, () => ({ default: { handle } }));

    await expect(import(CAMINHO_CLI)).rejects.toThrow('exit:1');

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(handle).not.toHaveBeenCalled();
    expect(construcoes).toHaveLength(0);
    expect(createUserSpy).not.toHaveBeenCalled();
  });

  test('fora de produção delega às etapas com a senha do ambiente, imprime o resumo e desconecta', async () => {
    const executarEtapas = jest.fn(async () => ({ professores: 5, alunos: 8 }));
    jest.unstable_mockModule(CAMINHO_ETAPAS, () => ({ executarEtapas }));

    await expect(import(CAMINHO_CLI)).resolves.toBeDefined();

    expect(executarEtapas).toHaveBeenCalledTimes(1);
    expect(executarEtapas.mock.calls[0][0].senha).toBe('valor-de-teste-do-seed');
    const saida = console.log.mock.calls.map(c => c.join(' ')).join('\n');
    expect(saida).toContain('Criado 5 professores');
    expect(saida).toContain('Criado 8 alunos');
    expect(exitSpy).not.toHaveBeenCalled();
    expect(disconnectSpy).toHaveBeenCalledTimes(1);
  });

  test('falha do seed encerra com código 1 e ainda desconecta', async () => {
    jest.unstable_mockModule(CAMINHO_SEED, () => ({
      default: { handle: jest.fn().mockRejectedValue(new Error('falha-sentinela')) }
    }));

    await expect(import(CAMINHO_CLI)).rejects.toThrow('exit:1');

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(disconnectSpy).toHaveBeenCalledTimes(1);
  });

  test('o guard é o primeiro import de seedCli.js', () => {
    const primeiroImport = readFileSync(new URL(CAMINHO_CLI, import.meta.url), 'utf8')
      .split('\n')
      .filter(l => l.startsWith('import '))[0];

    expect(primeiroImport).toBe("import './guardOnLoad.js';");
  });

  test('erro da linha de comando registra só name e code, sem mensagem nem objeto', async () => {
    const erro = new Error('falha com senha-sentinela-cli de sentinela-cli@example.com');
    erro.name = 'PrismaClientKnownRequestError';
    erro.code = 'P2002';
    jest.unstable_mockModule(CAMINHO_SEED, () => ({
      default: { handle: jest.fn().mockRejectedValue(erro) }
    }));
    const captura = capturarLog();

    await expect(import(CAMINHO_CLI)).rejects.toThrow('exit:1');
    const texto = captura.texto();

    expect(texto).toContain('PrismaClientKnownRequestError');
    expect(texto).toContain('P2002');
    expect(texto).not.toContain('senha-sentinela-cli');
    expect(texto).not.toContain('sentinela-cli@example.com');

    console.error('controle', erro);
    expect(captura.texto()).toContain('senha-sentinela-cli');
  });
});
