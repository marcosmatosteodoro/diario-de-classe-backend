import { LoginService } from '../../services/auth/loginService.js';
import { RegistrarFalhaLoginService } from '../../services/auth/registrarFalhaLoginService.js';
import { ZerarTentativasLoginService } from '../../services/auth/zerarTentativasLoginService.js';
import AbstractController from '../abstractController.js';

export class LoginController extends AbstractController {
  constructor(req, res) {
    super(req, res);
  }

  async execute() {
    try {
      const { email, senha } = this.req.body || {};
      if (!email || !senha) {
        return this.res.status(401).json({ message: this.req.t('auth.login.unauthorized') });
      }

      const response = await LoginService.handle(email, senha);

      const ip = this.req.ip || 'unknown';

      if (!response) {
        await RegistrarFalhaLoginService.handle(ip, email);
        return this.res.status(401).json({ message: this.req.t('auth.login.unauthorized') });
      }

      await ZerarTentativasLoginService.handle(ip, email);
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
