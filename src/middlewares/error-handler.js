import httpStatus from 'http-status';
import UnauthorizedError from '../utilities/errors/unauthorized.js';
import Constants from '../utilities/constants.js';
import { redactErrorForLog } from '../utilities/redactErrorForLog.js';

// Erro 4xx que o emissor marcou como exponível (ex.: body-parser).
function clientErrorResponse(err, t) {
  const status = err.status ?? err.statusCode;
  if (err.expose !== true || !Number.isInteger(status) || status < 400 || status >= 500) {
    return null;
  }
  const response =
    status === httpStatus.REQUEST_ENTITY_TOO_LARGE
      ? { error: 'PayloadTooLarge', message: t('api.errors.payload_too_large') }
      : { error: 'BadRequest', message: t('api.errors.bad_request') };
  return { statusCode: status, response };
}

// Fora de desenvolvimento a mensagem crua do erro (ex.: Prisma) não vai ao cliente.
function internalErrorBody(err, t) {
  const exposeDetail = Constants.env === 'development';
  return {
    error: exposeDetail ? err.message || 'Internal Server Error' : 'Internal Server Error',
    message: t('api.errors.internal_error')
  };
}

function logInternalError(err) {
  if (!Constants.isProduction) {
    console.log(err);
  } else {
    console.error('[ErrorHandler] Erro:', redactErrorForLog(err));
  }
}

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
      'api.errors.payload_too_large': 'Corpo da requisição excede o tamanho permitido',
      'api.errors.internal_error': 'Erro interno do servidor'
    };
    return fallbacks[key] || key;
  };

  const clientError = clientErrorResponse(err, t);

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
  } else if (clientError) {
    ({ statusCode, response } = clientError);
  } else {
    logInternalError(err);
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    response = internalErrorBody(err, t);
  }

  res.status(statusCode);
  res.json(response);
}

export function ThrowErrors(req) {
  if (req.errorList && req.errorList.length > 0) {
    throw req.errorList;
  }
}
