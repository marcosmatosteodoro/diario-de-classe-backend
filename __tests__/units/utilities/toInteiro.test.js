import { toInteiroOuNulo } from '../../../src/utilities/toInteiro.js';

describe('toInteiroOuNulo', () => {
  it('converte string numérica em inteiro', () => {
    // ValidateData.isNumber() aceita "3"; sem a coerção o Prisma recusava
    // String em coluna Int e o erro virava 500.
    expect(toInteiroOuNulo('3')).toBe(3);
  });

  it('mantém número inteiro', () => {
    expect(toInteiroOuNulo(7)).toBe(7);
  });

  it('trunca decimal', () => {
    expect(toInteiroOuNulo('3.9')).toBe(3);
    expect(toInteiroOuNulo(3.9)).toBe(3);
  });

  it.each([null, undefined, ''])('devolve null para %p', valor => {
    expect(toInteiroOuNulo(valor)).toBeNull();
  });

  it('devolve null para valor não numérico', () => {
    expect(toInteiroOuNulo('abc')).toBeNull();
    expect(toInteiroOuNulo({})).toBeNull();
  });

  it('devolve null para Infinity', () => {
    expect(toInteiroOuNulo(Infinity)).toBeNull();
  });

  it('preserva o zero', () => {
    expect(toInteiroOuNulo(0)).toBe(0);
    expect(toInteiroOuNulo('0')).toBe(0);
  });
});
