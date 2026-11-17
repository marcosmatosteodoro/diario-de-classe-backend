import Constants from '../../../src/utilities/constants.js';
import { prismaLogLevels, prismaClientOptions } from '../../../src/db/prismaLogLevels.js';

describe('prismaLogLevels', () => {
  test('em produção registra só warn e error', () => {
    expect(prismaLogLevels(true)).toEqual(['warn', 'error']);
  });

  test('fora de produção registra query, info, warn e error', () => {
    expect(prismaLogLevels(false)).toEqual(['query', 'info', 'warn', 'error']);
  });
});

describe('prismaClientOptions', () => {
  const isProductionOriginal = Constants.isProduction;

  afterEach(() => {
    Constants.isProduction = isProductionOriginal;
  });

  test('em produção entrega só warn e error', () => {
    Constants.isProduction = true;

    expect(prismaClientOptions()).toEqual({ log: ['warn', 'error'] });
  });

  test('fora de produção entrega a lista completa', () => {
    Constants.isProduction = false;

    expect(prismaClientOptions()).toEqual({ log: ['query', 'info', 'warn', 'error'] });
  });
});
