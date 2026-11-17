import { textoIgualEmTempoConstante } from '../../../src/utilities/textoIgualEmTempoConstante.js';

describe('textoIgualEmTempoConstante', () => {
  test('igual, diferente, tamanhos distintos e não-string', () => {
    expect(textoIgualEmTempoConstante('abc', 'abc')).toBe(true);
    expect(textoIgualEmTempoConstante('abc', 'abd')).toBe(false);
    expect(textoIgualEmTempoConstante('abc', 'abcd')).toBe(false);
    expect(textoIgualEmTempoConstante('abcd', 'abc')).toBe(false);
    expect(textoIgualEmTempoConstante('abc', null)).toBe(false);
    expect(textoIgualEmTempoConstante(undefined, 'abc')).toBe(false);
  });
});
