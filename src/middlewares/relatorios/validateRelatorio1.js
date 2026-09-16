/**
 * Verifica se um valor de data de query é válido: ausente/vazio passa
 * (filtro opcional), presente precisa virar uma `Date` válida.
 * @param {string} [value] - valor recebido em `req.query`
 * @returns {boolean} true quando ausente/vazio ou data válida
 */
const isValidDateOrAbsent = value => {
  if (value === undefined || value === null || value === '') return true;
  return !Number.isNaN(new Date(value).getTime());
};

/**
 * Middleware para validar os filtros do relatório 1: `dataInicial` e
 * `dataFinal`, quando informados, devem ser datas válidas. `idAluno` e
 * `idProfessor` seguem livres (filtro por ID exato, sem formato a validar).
 *
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 * @returns {void}
 */
export const validateRelatorio1 = (req, res, next) => {
  const { dataInicial, dataFinal } = req.query;

  if (!isValidDateOrAbsent(dataInicial) || !isValidDateOrAbsent(dataFinal)) {
    const field = !isValidDateOrAbsent(dataInicial) ? 'dataInicial' : 'dataFinal';
    return res.status(400).json({
      message: req.t
        ? req.t('relatorios.validate.invalid_dates')
        : 'Datas informadas são inválidas',
      field
    });
  }

  return next();
};

export default validateRelatorio1;
