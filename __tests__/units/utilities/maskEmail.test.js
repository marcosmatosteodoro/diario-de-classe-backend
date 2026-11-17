import { maskEmail } from '../../../src/utilities/maskEmail.js';

describe('maskEmail', () => {
  test.each([
    ['joao.silva@example.com', 'j***@example.com'],
    ['a@example.com', 'a***@example.com'],
    ['semarroba', 's***'],
    ['', '***'],
    [undefined, '***'],
    [{ x: 1 }, '***']
  ])('%p -> %p', (entrada, esperado) => {
    expect(maskEmail(entrada)).toBe(esperado);
  });
});
