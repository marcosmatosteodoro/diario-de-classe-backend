import AbstractController from '../abstractController.js';
import { LogoutService } from '../../services/auth/logoutService.js';
import LoggerManager from '../../utilities/loggerManager.js';
import { getLoginClientIp } from '../../utilities/loginAttemptKeys.js';
import { clearSessionCookie, readSessionCookie } from '../../utilities/sessionCookie.js';

export class LogoutController extends AbstractController {
  constructor(req, res) {
    super(req, res);
  }

  /**
   * Responde 204 em todo sucesso (inclusive sem sessão a encerrar) e remove o cookie; em falha
   * inesperada mantém o cookie para a saída poder ser repetida.
   */
  async execute() {
    try {
      const { revogado } = await LogoutService.handle(readSessionCookie(this.req));

      clearSessionCookie(this.res);
      LoggerManager.info('auth.logout', { revogado, ip: getLoginClientIp(this.req) });
      return this.res.status(204).json();
    } catch (error) {
      // Sem remover o cookie: a saída precisa poder ser repetida.
      return this.handleError(error, 'auth.logout.error');
    }
  }

  static async handle(req, res) {
    const controller = new LogoutController(req, res);
    await controller.execute();
  }
}
