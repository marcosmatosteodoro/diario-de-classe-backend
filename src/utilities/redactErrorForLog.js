/**
 * Reduz um erro do Prisma (nome iniciando com "PrismaClient") a `name`,
 * `code` (quando houver) e as chaves de `meta` — nunca valores, nunca
 * `message`: erros do Prisma embutem os argumentos da chamada na mensagem
 * (DEC-002-006), o que vazaria dados sensíveis do payload (ex.: senha) no
 * log. Erro não-Prisma é devolvido sem alteração.
 * @param {Error} error - Erro a ser avaliado
 * @returns {Error|{name: string, code?: string, meta?: string[]}}
 */
export function redactErrorForLog(error) {
  const isPrismaError = typeof error?.name === 'string' && error.name.startsWith('PrismaClient');
  if (!isPrismaError) {
    return error;
  }

  const redacted = { name: error.name };
  if (error.code) {
    redacted.code = error.code;
  }
  if (error.meta && typeof error.meta === 'object') {
    redacted.meta = Object.keys(error.meta);
  }
  return redacted;
}
