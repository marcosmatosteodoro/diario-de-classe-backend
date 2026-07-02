/**
 * Normaliza uma dataAula para a chave de dia em UTC (YYYY-MM-DD).
 *
 * As aulas vindas do Prisma têm `dataAula` como objeto `Date`, enquanto as que
 * chegam no corpo da requisição (JSON) são `string`. Comparar os dois lados com
 * `===` sempre retornava `false`, fazendo a reconciliação apagar e recriar
 * todas as aulas em vez de casar por data. Normalizar ambos para a chave de dia
 * corrige isso e alinha com a regra de uma aula por dia no contrato.
 *
 * @param {Date|string} dataAula
 * @returns {string} data no formato YYYY-MM-DD (UTC)
 */
export function dataAulaKey(dataAula) {
  return new Date(dataAula).toISOString().slice(0, 10);
}
