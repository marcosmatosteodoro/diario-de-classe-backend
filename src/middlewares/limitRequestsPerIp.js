import { ReservarRequisicaoPorIpService } from '../services/seguranca/reservarRequisicaoPorIpService.js';
import Constants from '../utilities/constants.js';
import LoggerManager from '../utilities/loggerManager.js';
import { rotaSemQuery } from '../utilities/rotaSemQuery.js';

/**
 * Conta cada requisição por IP de origem numa janela e recusa com 429 + Retry-After acima
 * do limite. Desligado, passa sem tocar o armazenamento. Erro no contador ou IP
 * indeterminado nega com 503 (fail secure). O log da recusa não leva o IP.
 *
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
export const limitRequestsPerIp = async (req, res, next) => {
  if (!Constants.rateLimitGlobal) return next();

  try {
    const { permitido, segundosRestantes, primeiraRecusa } =
      await ReservarRequisicaoPorIpService.handle(req.ip);

    if (permitido) return next();

    if (primeiraRecusa) {
      LoggerManager.warn('rate_limit.bloqueio', {
        metodo: req.method,
        rota: rotaSemQuery(req),
        segundosRestantes,
        limite: Constants.rateLimitMaxRequisicoes
      });
    }
    res.set('Retry-After', String(segundosRestantes));
    return res
      .status(429)
      .json({ message: req.t('api.errors.too_many_requests', { segundos: segundosRestantes }) });
  } catch (error) {
    // Só name/code: a mensagem de erro do ORM pode embutir argumentos da chamada.
    LoggerManager.error('Erro ao consultar o limite de requisições por IP', {
      name: error?.name,
      code: error?.code
    });
    return res.status(503).json({ message: req.t('api.errors.service_unavailable') });
  }
};
