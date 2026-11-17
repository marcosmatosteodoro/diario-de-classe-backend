/**
 * Níveis de log do Prisma Client: em produção só `warn` e `error` (`query` e `info`
 * registrariam SQL e parâmetros).
 * @param {boolean} isProduction
 * @returns {string[]}
 */
export function prismaLogLevels(isProduction) {
  return isProduction ? ['warn', 'error'] : ['query', 'info', 'warn', 'error'];
}
