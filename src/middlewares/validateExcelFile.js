/**
 * Middleware para validar se o parâmetro ID é válido
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 * @returns {void}
 */
export const validateExcelFile = (req, res, next) => {
  // Verifica se existe um arquivo no request
  if (!req.file) {
    return res.status(400).json({
      message: req.t ? req.t('validation.excel_file.required') : 'Arquivo Excel é obrigatório'
    });
  }

  // Verifica se o arquivo é do tipo Excel ou CSV
  const allowedMimeTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'text/csv' // .csv
  ];

  if (!allowedMimeTypes.includes(req.file.mimetype)) {
    return res.status(400).json({
      message: req.t
        ? req.t('validation.excel_file.invalid_type')
        : 'Tipo de arquivo inválido. Apenas arquivos Excel ou CSV são permitidos'
    });
  }

  return next();
};

export default validateExcelFile;
