/**
 * Middleware para validar se o parâmetro ID é válido
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 * @returns {void}
 */
export const validateId = (req, res, next) => {
  const { id } = req.params;

  // Verifica se o ID foi fornecido
  if (!id) {
    return res.status(400).json({
      message: req.t ? req.t('validation.id.required') : 'ID é obrigatório'
    });
  }

  // Verifica se o ID é um CUID válido (formato: c + 24 caracteres alfanuméricos)
  // CUIDs começam com 'c' seguido de caracteres alfanuméricos minúsculos
  const cuidRegex = /^c[a-z0-9]{24}$/;

  if (!cuidRegex.test(id)) {
    return res.status(400).json({
      message: req.t ? req.t('validation.id.invalid') : 'ID deve ser um identificador válido'
    });
  }

  // Adiciona o ID validado ao req para uso nos controllers (mantém como string para CUIDs)
  req.validatedId = id;

  return next();
};

export default validateId;
