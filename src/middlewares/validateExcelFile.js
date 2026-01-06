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

  // Tipos MIME aceitos
  const allowedMimeTypes = [
    'text/csv',
    'application/csv',
    'application/vnd.ms-excel', // .xls
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // .xlsx
  ];

  // Extensões aceitas
  const allowedExtensions = ['.csv', '.xls', '.xlsx'];

  const file = req.file;
  const mimeType = file.mimetype;
  const originalName = file.originalname.toLowerCase();

  // Verifica o tipo MIME
  const isMimeTypeValid = allowedMimeTypes.includes(mimeType);

  // Verifica a extensão do arquivo
  const hasValidExtension = allowedExtensions.some(ext => originalName.endsWith(ext));

  // Se o tipo MIME ou extensão não forem válidos, retorna erro
  if (!isMimeTypeValid && !hasValidExtension) {
    return res.status(400).json({
      message: req.t
        ? req.t('validation.excel_file.invalid_type')
        : 'Tipo de arquivo inválido. Apenas arquivos Excel ou CSV são permitidos',
      receivedMimeType: mimeType,
      receivedFileName: file.originalname,
      allowedFormats: ['CSV', 'XLS', 'XLSX']
    });
  }

  // Opcional: Validar tamanho do arquivo (ex: max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB em bytes
  if (file.size > maxSize) {
    return res.status(400).json({
      message: 'Arquivo muito grande. Tamanho máximo permitido: 10MB',
      error: 'FILE_TOO_LARGE',
      receivedSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      maxSize: '10MB'
    });
  }

  return next();
};

export default validateExcelFile;
