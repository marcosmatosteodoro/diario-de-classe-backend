/**
 * Rota da requisição sem a query string (a query pode carregar dado pessoal).
 * Ordem: `req.originalUrl` → `req.url` → `''`.
 * @param {{originalUrl?: string, url?: string}} req
 * @returns {string}
 */
export function rotaSemQuery(req) {
  const url = req.originalUrl ?? req.url ?? '';
  const consulta = url.indexOf('?');
  return consulta === -1 ? url : url.slice(0, consulta);
}
