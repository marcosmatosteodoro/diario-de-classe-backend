/**
 * Converte para inteiro, devolvendo null para vazio/invalido.
 *
 * `ValidateData.isNumber()` usa `!isNaN(parseFloat(value))`, entao string
 * numerica passa na validacao ("3" e valido). O Prisma, porem, recusa String em
 * coluna Int com PrismaClientValidationError, que cai no handleError e vira 500
 * em vez de um erro de validacao. Coagir na borda do service mantem o campo com
 * o tipo que a coluna espera.
 *
 * @param {any} valor
 * @returns {number|null}
 */
export function toInteiroOuNulo(valor) {
  if (valor === null || valor === undefined || valor === '') {
    return null;
  }

  const numero = Number(valor);

  return Number.isFinite(numero) ? Math.trunc(numero) : null;
}
