import { LoginService } from '../../services/auth/loginService.js';
import AbstractController from '../abstractController.js';

export class LoginController extends AbstractController {
  constructor(req, res) {
    super(req, res);
  }

  async execute() {
    try {
      const { email, senha } = this.req.body || {};

      const response = await LoginService.handle(email, senha);

      if (!response) {
        return this.res.status(401).json({ message: this.req.t('auth.login.unauthorized') });
      }

      return this.res.status(200).json(response);
    } catch (error) {
      return this.handleError(error, 'auth.login.error');
    }
  }

  static async handle(req, res) {
    const controller = new LoginController(req, res);
    await controller.execute();
  }
}
