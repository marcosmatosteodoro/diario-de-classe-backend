import AbstractController from '../abstractController.js';
import { LogoutService } from '../../services/auth/logoutService.js';
import { clearSessionCookie, readSessionCookie } from '../../utilities/sessionCookie.js';

export class LogoutController extends AbstractController {
  constructor(req, res) {
    super(req, res);
  }

  async execute() {
    try {
      await LogoutService.handle(readSessionCookie(this.req));

      clearSessionCookie(this.res);
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
