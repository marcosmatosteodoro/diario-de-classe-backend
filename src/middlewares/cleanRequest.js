export default async function cleanRequest(req, res, next) {
  const testEmptness = value =>
    value === null || value === '' || value === undefined || value === 'null';
  // No Express 5, req.query é um getter sem cache que reparseia req.url a cada
  // acesso, devolvendo um objeto novo toda vez: mutar (ou até só ler duas vezes)
  // o retorno de `req.query` não persiste. Por isso o getter é acessado UMA
  // única vez aqui, o resultado é limpo numa cópia local, e a propriedade é
  // substituída por um valor de dado gravável (o `query` original do Express
  // tem `configurable: true`, o que permite a troca) — daí em diante `req.query`
  // é um objeto fixo, e middlewares seguintes (ex.: validateSearchQuery)
  // conseguem mutá-lo de verdade.
  const query = req.query;
  if (query) {
    const cleanedQuery = { ...query };
    Object.keys(cleanedQuery).forEach(
      key => testEmptness(cleanedQuery[key]) && delete cleanedQuery[key]
    );
    Object.defineProperty(req, 'query', {
      value: cleanedQuery,
      writable: true,
      configurable: true,
      enumerable: true
    });
  }
  if (req.params) {
    Object.keys(req.params).forEach(key => testEmptness(req.params[key]) && delete req.params[key]);
  }
  if (req.body) {
    Object.keys(req.body).forEach(key => testEmptness(req.body[key]) && delete req.body[key]);
  }
  next();
}
