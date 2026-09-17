import Constants from '../../utilities/constants.js';

const TIPOS_AULA = ['PADRAO', 'REPOSICAO', 'OUTRA'];
const STATUS_AULA = ['AGENDADA', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA', 'CANCELADA_POR_FALTA'];

// Mesmo predicado usado pelo controller consumidor (getAulaListController) ao montar
// `new Date(`${dataInicio}T00:00:00.000Z`)`: validar com uma expressão diferente aceitaria
// aqui valores que o controller falharia em parsear, gerando 500 a jusante.
const isDataValida = valor => !Number.isNaN(new Date(`${valor}T00:00:00.000Z`).getTime());

/**
 * Valida os filtros de query da listagem de aulas (tipo, status, dataInicio, dataTermino)
 * @param {Object} query - req.query
 * @param {Function} t - Função de tradução
 * @returns {Object|null} Erro ({message, field}) ou null se válido
 */
export const validateAulaListQueryParams = (query, t) => {
  const { tipo, status, dataInicio, dataTermino } = query || {};

  const message = t ? t('validation.aula.invalidFilter') : 'Filtro inválido para aulas';

  const checks = [
    { field: 'tipo', valor: tipo, isValido: valor => TIPOS_AULA.includes(valor) },
    { field: 'status', valor: status, isValido: valor => STATUS_AULA.includes(valor) },
    { field: 'dataInicio', valor: dataInicio, isValido: isDataValida },
    { field: 'dataTermino', valor: dataTermino, isValido: isDataValida }
  ];

  const invalido = checks.find(({ valor, isValido }) => valor && !isValido(valor));

  return invalido ? { message, field: invalido.field } : null;
};

/**
 * Middleware para validar os filtros de query da listagem de aulas
 * - Campos ausentes são ignorados (filtros opcionais)
 * - tipo/status precisam bater com os enums Prisma (TipoAula/StatusAula)
 * - dataInicio/dataTermino precisam ser datas válidas
 *
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
export const validateAulaListQuery = (req, res, next) => {
  try {
    const validationError = validateAulaListQueryParams(req.query, req.t);
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
