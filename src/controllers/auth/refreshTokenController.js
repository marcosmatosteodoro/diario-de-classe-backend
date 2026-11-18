import AbstractController from '../abstractController.js';
import { RefreshTokenService } from '../../services/auth/refreshTokenService.js';
import { clearSessionCookie, readSessionCookie } from '../../utilities/sessionCookie.js';

export class RefreshTokenController extends AbstractController {
  constructor(req, res) {
    super(req, res);
  }

  async execute() {
    try {
      const resultado = await RefreshTokenService.handle(readSessionCookie(this.req));

      if (!resultado) {
        clearSessionCookie(this.res);
        return this.res.status(401).json({ message: this.req.t('auth.refresh.unauthorized') });
      }

      return this.res.status(200).json(resultado);
    } catch (error) {
      return this.handleError(error, 'auth.refresh.error');
    }
  }

  static async handle(req, res) {
    const controller = new RefreshTokenController(req, res);
    await controller.execute();
  }
}
