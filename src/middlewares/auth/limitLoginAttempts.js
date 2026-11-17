import { VerificarBloqueioLoginService } from '../../services/auth/verificarBloqueioLoginService.js';
import LoggerManager from '../../utilities/loggerManager.js';
import { maskEmail } from '../../utilities/maskEmail.js';

/**
 * Bloqueia o login (429 + Retry-After) enquanto o IP+e-mail ou o IP estão acima
 * do teto na janela vigente, sem chegar ao LoginController. Erro ao consultar
 * o contador nega a requisição (fail secure).
 *
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
export const limitLoginAttempts = async (req, res, next) => {
  const ip = req.ip || 'unknown';
  const email = req.body?.email;

  try {
    const retryAfter = await VerificarBloqueioLoginService.handle(ip, email);

    if (retryAfter > 0) {
      LoggerManager.warn('Login bloqueado por excesso de tentativas', {
        ip,
        email: maskEmail(email),
        retryAfter
      });
      res.set('Retry-After', String(retryAfter));
      return res.status(429).json({ message: req.t('auth.login.too_many_attempts') });
    }

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
