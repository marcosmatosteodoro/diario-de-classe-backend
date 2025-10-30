import httpStatus from 'http-status';
import UnauthorizedError from '../utilities/errors/unauthorized.js';
import Constants from '../utilities/constants.js';

export default function ErrorHandler(err, req, res) {
  let statusCode = httpStatus.BAD_REQUEST;
  let response = { error: err && err.code ? err.code : null };

  // Função helper para obter tradução (fallback se req.t não existir)
  const t = (key, options) => {
    if (req.t && typeof req.t === 'function') {
      return req.t(key, options);
    }
    // Fallback para português se i18n não estiver disponível
    const fallbacks = {
      'api.errors.bad_request': 'Requisição inválida',
      'api.errors.unauthorized': 'Não autorizado',
      'api.errors.internal_error': 'Erro interno do servidor'
    };
    return fallbacks[key] || key;
  };

  if (err.errors && err.errors.length > 0) {
    statusCode = httpStatus.BAD_REQUEST;
    response = {
      error: err.errors.pop().msg,
      message: t('api.errors.bad_request')
    };
  } else if (err instanceof UnauthorizedError) {
    statusCode = httpStatus.UNAUTHORIZED;
    response = {
      error: 'UnauthorizedError',
      message: t('api.errors.unauthorized')
    };
  } else {
    if (!Constants.isProduction) {
      console.log(err);
    }
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    response = {
      error: err.message || 'Internal Server Error',
      message: t('api.errors.internal_error')
    };
  }

  res.status(statusCode);
  res.json(response);
}

export function ThrowErrors(req) {
  if (req.errorList && req.errorList.length > 0) {
    throw req.errorList;
  }
}
