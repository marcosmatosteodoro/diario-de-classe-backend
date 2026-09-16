import Constants from '../../utilities/constants.js';

const IDIOMAS = ['INGLES', 'ESPANHOL', 'FRANCES'];

// Mesmo predicado usado pelos controllers consumidores (getContratoListController) ao
// montar `new Date(`${dataInicio}T00:00:00.000Z`)`: validar com uma expressão diferente
// aceitaria aqui valores que o controller falharia em parsear, gerando 500 a jusante.
const isDataValida = valor => !Number.isNaN(new Date(`${valor}T00:00:00.000Z`).getTime());

/**
 * Valida os filtros de query da listagem de contratos (idioma, dataInicio, dataTermino)
 * @param {Object} query - req.query
 * @param {Function} t - Função de tradução
 * @returns {Object|null} Erro ({message, field}) ou null se válido
 */
export const validateContratoListQueryParams = (query, t) => {
  const { idioma, dataInicio, dataTermino } = query || {};

  const message = t ? t('validation.contrato.invalidFilter') : 'Filtro inválido para contratos';

  const checks = [
    { field: 'idioma', valor: idioma, isValido: valor => IDIOMAS.includes(valor) },
    { field: 'dataInicio', valor: dataInicio, isValido: isDataValida },
    { field: 'dataTermino', valor: dataTermino, isValido: isDataValida }
  ];

  const invalido = checks.find(({ valor, isValido }) => valor && !isValido(valor));

  return invalido ? { message, field: invalido.field } : null;
};

/**
 * Middleware para validar os filtros de query da listagem de contratos
 * - Campos ausentes são ignorados (filtros opcionais)
 * - idioma precisa bater com o enum Prisma (Idioma)
 * - dataInicio/dataTermino precisam ser datas válidas
 *
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
export const validateContratoListQuery = (req, res, next) => {
  try {
    const validationError = validateContratoListQueryParams(req.query, req.t);
    if (validationError) {
      return res.status(400).json(validationError);
    }

    return next();
  } catch (error) {
    const errorResponse = {
      message: req.t ? req.t('error.internal') : 'Erro interno do servidor'
    };

    // Erro inesperado (500) fora de desenvolvimento: não vaza error.message cru na resposta ao cliente.
    if (Constants.env === 'development') {
      errorResponse.error = error.message;
    }

    return res.status(500).json(errorResponse);
  }
};
