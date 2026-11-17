import { timingSafeEqual } from 'node:crypto';

/**
 * Comparação em tempo constante de strings; tamanhos diferentes ou tipo não-string → `false`.
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
export function textoIgualEmTempoConstante(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
