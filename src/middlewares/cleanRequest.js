export default async function cleanRequest(req, res, next) {
  const testEmptness = value =>
    value === null || value === '' || value === undefined || value === 'null';
  if (req.query) {
    Object.keys(req.query).forEach(key => testEmptness(req.query[key]) && delete req.query[key]);
  }
  if (req.params) {
    Object.keys(req.params).forEach(key => testEmptness(req.params[key]) && delete req.params[key]);
  }
  if (req.body) {
    Object.keys(req.body).forEach(key => testEmptness(req.body[key]) && delete req.body[key]);
  }
  next();
}
