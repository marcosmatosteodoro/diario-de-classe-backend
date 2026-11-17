import { prismaLogLevels } from '../../../src/db/prismaLogLevels.js';

describe('prismaLogLevels', () => {
  test('em produção registra só warn e error', () => {
    expect(prismaLogLevels(true)).toEqual(['warn', 'error']);
  });

  test('fora de produção registra query, info, warn e error', () => {
    expect(prismaLogLevels(false)).toEqual(['query', 'info', 'warn', 'error']);
  });
});
