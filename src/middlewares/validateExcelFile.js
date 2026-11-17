import fs from 'fs';

const assinaturas = {
  '.xlsx': Buffer.from([0x50, 0x4b, 0x03, 0x04]),
  '.xls': Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])
};
const bytesInspecionadosCsv = 8 * 1024;

/**
 * Confere os primeiros bytes do arquivo gravado contra a extensão declarada.
 * Qualquer falha de leitura recusa (fail secure).
 */
const conteudoCombinaComExtensao = (caminho, extensao) => {
  let fd;
  try {
    fd = fs.openSync(caminho, 'r');
    const buffer = Buffer.alloc(extensao === '.csv' ? bytesInspecionadosCsv : 8);
    const lidos = fs.readSync(fd, buffer, 0, buffer.length, 0);
    const inicio = buffer.subarray(0, lidos);
    if (extensao === '.csv') {
      return !inicio.includes(0x00);
    }
    const assinatura = assinaturas[extensao];
    return Boolean(assinatura) && inicio.subarray(0, assinatura.length).equals(assinatura);
  } catch {
    return false;
  } finally {
    if (fd !== undefined) fs.closeSync(fd);
  }
};

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
  const extension = allowedExtensions.find(ext => originalName.endsWith(ext));
  const hasValidExtension = extension !== undefined;

  // MIME e extensão são escolhidos pelo cliente: os dois precisam estar nas listas e o
  // conteúdo gravado precisa bater com a extensão declarada.
  if (!isMimeTypeValid || !hasValidExtension || !conteudoCombinaComExtensao(file.path, extension)) {
    return res.status(400).json({
      message: req.t
        ? req.t('validation.excel_file.invalid_type')
        : 'Tipo de arquivo inválido. Apenas arquivos Excel ou CSV são permitidos',
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
