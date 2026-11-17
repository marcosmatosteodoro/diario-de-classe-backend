import { LoginService } from '../../services/auth/loginService.js';
import { ZerarTentativasLoginService } from '../../services/auth/zerarTentativasLoginService.js';
import AbstractController from '../abstractController.js';
import LoggerManager from '../../utilities/loggerManager.js';
import { getLoginClientIp } from '../../utilities/loginAttemptKeys.js';
import { maskEmail } from '../../utilities/maskEmail.js';

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

      const ip = getLoginClientIp(this.req);

      if (!response) {
        // A tentativa já foi contada pelo middleware; aqui só se registra a falha.
        LoggerManager.warn('Falha de login', { ip, email: maskEmail(email) });
        return this.res.status(401).json({ message: this.req.t('auth.login.unauthorized') });
      }

      await ZerarTentativasLoginService.handle(ip, email, this.req.expiraEmReservaIp);
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
