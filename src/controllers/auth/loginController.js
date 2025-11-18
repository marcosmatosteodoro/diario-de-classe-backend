import { LoginService } from '../../services/auth/loginService.js';
import AbstractController from '../abstractController.js';

export class LoginController extends AbstractController {
  constructor(req, res) {
    super(req, res);
  }

  async execute() {
    try {
      const { email, senha } = this.req.body || {};

      if (!email || !senha) {
        return this.res.status(400).json({ message: 'validation.no_credentials' });
      }

      const token = await LoginService.handle(email, senha);

      if (!token) {
        return this.res.status(401).json('auth.login.unauthorized');
      }

      return this.res.status(200).json(token);
    } catch (error) {
      return this.handleError(error, 'auth.login.error');
    }
  }

  static async handle(req, res) {
    const controller = new LoginController(req, res);
    await controller.execute();
  }
}
