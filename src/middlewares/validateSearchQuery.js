/**
 * Valida se o parâmetro de busca 'q' é válido
 * @param {string} q - Parâmetro de busca
 * @param {Function} t - Função de tradução
 * @returns {Object|null} Erro ou null se válido
 */
const validateQueryParam = (q, t) => {
  if (typeof q !== 'string') {
    return {
      message: t ? t('validation.search.invalidType') : 'Parâmetro de busca deve ser uma string',
      field: 'q'
    };
  }

  if (q.length > 200) {
    return {
      message: t ? t('validation.search.tooLong') : 'Parâmetro de busca muito longo',
      field: 'q'
    };
  }

  return null;
};

/**
 * Middleware para validar parâmetro de busca 'q'
 * - Se não existir, permite continuar
 * - Se existir mas estiver vazio, remove o parâmetro
 * - Se existir com conteúdo, valida se é uma string válida
 *
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
export const validateSearchQuery = (req, res, next) => {
  try {
    // Se não tem parâmetro q, continua normalmente
    if (!Object.prototype.hasOwnProperty.call(req.query, 'q')) {
      return next();
    }

    const { q } = req.query;

    // Se o parâmetro q existe mas está vazio, null ou undefined, remove
    if (q === '' || q === null || q === undefined) {
      delete req.query.q;
      return next();
    }

    // Valida o parâmetro
    const validationError = validateQueryParam(q, req.t);
    if (validationError) {
      return res.status(400).json(validationError);
    }

    // Se chegou até aqui, q é uma string válida
    // Se a string contém apenas espaços em branco, remove
    const trimmedQuery = q.trim();
    if (trimmedQuery === '') {
      delete req.query.q;
      return next();
    }

    // Atualiza o parâmetro com a versão limpa (trim)
    req.query.q = trimmedQuery;

    // Se chegou até aqui, o parâmetro é válido
    return next();
  } catch (error) {
    return res.status(500).json({
      message: req.t ? req.t('error.internal') : 'Erro interno do servidor',
      error: error.message
    });
  }
};
