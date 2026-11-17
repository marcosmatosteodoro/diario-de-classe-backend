import { ReservarTentativaLoginService } from '../../services/auth/reservarTentativaLoginService.js';
import { getLoginClientIp } from '../../utilities/loginAttemptKeys.js';
import LoggerManager from '../../utilities/loggerManager.js';
import { maskEmail } from '../../utilities/maskEmail.js';

/**
 * Reserva a tentativa nos contadores IP e IP+e-mail (nessa ordem) antes de verificar a
 * credencial; a decisão sai do valor devolvido pela mesma escrita. Acima do
 * teto: 429 + Retry-After, sem chegar ao LoginController. Liberada: o fim da janela da
 * reserva do IP segue em `req.expiraEmReservaIp`, para o controller devolver
 * a reserva só dentro dessa janela. Erro no contador nega a requisição (fail secure).
 *
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
export const limitLoginAttempts = async (req, res, next) => {
  const ip = getLoginClientIp(req);
  const email = req.body?.email;

  try {
    const { segundosBloqueio: retryAfter, expiraEmIp } = await ReservarTentativaLoginService.handle(
      ip,
      email
    );

    if (retryAfter > 0) {
      LoggerManager.warn('Login bloqueado por excesso de tentativas', {
        ip,
        email: maskEmail(email),
        retryAfter
      });
      res.set('Retry-After', String(retryAfter));
      return res.status(429).json({ message: req.t('auth.login.too_many_attempts') });
    }

    req.expiraEmReservaIp = expiraEmIp;
    return next();
  } catch (error) {
    // Só name/code: a mensagem de erro do ORM pode embutir argumentos da chamada.
    LoggerManager.error('Erro ao consultar o limite de tentativas de login', {
      name: error?.name,
      code: error?.code
    });
    return res.status(503).json({ message: req.t('auth.login.error') });
  }
};
