import AbstractController from '../abstractController.js';
import { RefreshTokenService } from '../../services/auth/refreshTokenService.js';
import LoggerManager from '../../utilities/loggerManager.js';
import { getLoginClientIp } from '../../utilities/loginAttemptKeys.js';
import ServiceUnavailableError from '../../utilities/errors/serviceUnavailable.js';
import {
  clearSessionCookie,
  readSessionCookie,
  setSessionCookie
} from '../../utilities/sessionCookie.js';

export class RefreshTokenController extends AbstractController {
  constructor(req, res) {
    super(req, res);
  }

  /**
   * 200 com o refresh só no cookie `bls_sessao` (nunca no corpo), 401 com remoção do cookie ou 500
   * (`handleError`, cookie intocado). O reuso (`{ reuso }` do service) responde igual à recusa e
   * registra `auth.sessao.reuso` antes, só com `userId`, `idSessao` e `ip` (DEC-005-024).
   * @throws {ServiceUnavailableError} propagado ao ErrorHandler (503) sem mexer no cookie
   */
  async execute() {
    try {
      const resultado = await RefreshTokenService.handle(readSessionCookie(this.req));

      if (!resultado || resultado.reuso) {
        this.registrarReuso(resultado?.reuso);
        clearSessionCookie(this.res);
        return this.res.status(401).json({ message: this.req.t('auth.refresh.unauthorized') });
      }

      const { refreshToken, restanteSegundos, ...corpo } = resultado;
      setSessionCookie(this.res, refreshToken, restanteSegundos);

      return this.res.status(200).json(corpo);
    } catch (error) {
      if (error instanceof ServiceUnavailableError) {
        throw error;
      }
      return this.handleError(error, 'auth.refresh.error');
    }
  }

  registrarReuso(reuso) {
    if (!reuso) {
      return;
    }
    LoggerManager.warn('auth.sessao.reuso', {
      userId: reuso.idUsuario,
      idSessao: reuso.idSessao,
      ip: getLoginClientIp(this.req)
    });
  }

  static async handle(req, res) {
    const controller = new RefreshTokenController(req, res);
    await controller.execute();
  }
}
