import { jest } from '@jest/globals';
import Constants from '../../../../src/utilities/constants.js';
import { assertSeedAllowed } from '../../../../src/db/seeds/seedGuard.js';
import { ProfessoresSeed } from '../../../../src/db/seeds/models/professoresSeed.js';
import { CreateUserService } from '../../../../src/services/user/createUserService.js';

describe('seed de professores', () => {
  const isProductionOriginal = Constants.isProduction;
  const seedPasswordOriginal = process.env.SEED_PASSWORD;

  beforeEach(() => {
    Constants.isProduction = false;
    process.env.SEED_PASSWORD = 'valor-de-teste-do-seed';
  });

  afterEach(() => {
    Constants.isProduction = isProductionOriginal;
    if (seedPasswordOriginal === undefined) delete process.env.SEED_PASSWORD;
    else process.env.SEED_PASSWORD = seedPasswordOriginal;
  });

  test('recusa executar em produção', () => {
    Constants.isProduction = true;

    expect(() => assertSeedAllowed()).toThrow('O seed não pode ser executado em produção.');
  });

  test('recusa executar sem SEED_PASSWORD', () => {
    delete process.env.SEED_PASSWORD;

    expect(() => assertSeedAllowed()).toThrow(/SEED_PASSWORD/);
  });

  test('recusa SEED_PASSWORD vazia', () => {
    process.env.SEED_PASSWORD = '   ';

    expect(() => assertSeedAllowed()).toThrow(/SEED_PASSWORD/);
  });

  test('fora de produção e com a variável definida, libera', () => {
    expect(assertSeedAllowed()).toBe('valor-de-teste-do-seed');
  });

  test('todos os usuários são criados com a senha vinda da variável', async () => {
    const criados = [];
    jest.spyOn(CreateUserService, 'handle').mockImplementation(async data => {
      criados.push(data);
      return data;
    });

    await ProfessoresSeed.handle();

    expect(criados).toHaveLength(11);
    expect(criados.map(u => u.senha)).toEqual(Array(11).fill('valor-de-teste-do-seed'));
  });

  test('sem a variável o seed de professores não cria ninguém', async () => {
    delete process.env.SEED_PASSWORD;
    const spy = jest.spyOn(CreateUserService, 'handle').mockResolvedValue({});

    await expect(ProfessoresSeed.handle()).rejects.toThrow(/SEED_PASSWORD/);
    expect(spy).not.toHaveBeenCalled();
  });
});
