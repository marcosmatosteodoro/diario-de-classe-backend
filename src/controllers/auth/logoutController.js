import AbstractController from '../abstractController.js';
import { LogoutService } from '../../services/auth/logoutService.js';

export class LogoutController extends AbstractController {
  constructor(req, res) {
    super(req, res);
  }

  async execute() {
    try {
      const { refreshToken } = this.req.body || {};

      const result = await LogoutService.handle(refreshToken);

      if (!result) {
        return this.res.status(400).json({ message: this.req.t('auth.logout.error') });
      }

      return this.res.status(204).json();
    } catch (error) {
      return this.handleError(error, 'auth.logout.error');
    }
  }

  static async handle(req, res) {
    const controller = new LogoutController(req, res);
    await controller.execute();
  }
}
