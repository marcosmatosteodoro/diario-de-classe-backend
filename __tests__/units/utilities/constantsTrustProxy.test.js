import Constants from '../../../src/utilities/constants.js';

describe('Constants.parseTrustProxy', () => {
  test.each([
    [undefined, undefined],
    ['', undefined],
    ['true', undefined],
    ['TRUE', undefined],
    ['false', undefined],
    ['1', 1],
    ['2', 2],
    ['0', 0],
    ['loopback', undefined],
    ['-1', undefined]
  ])('%p -> %p', (entrada, esperado) => {
    expect(Constants.parseTrustProxy(entrada)).toBe(esperado);
  });

  test('defaults do limite de login', () => {
    expect(Constants.loginMaxTentativasPorEmail).toBe(5);
    expect(Constants.loginMaxTentativasPorIp).toBe(30);
    expect(Constants.loginJanelaSegundos).toBe(900);
  });
});
