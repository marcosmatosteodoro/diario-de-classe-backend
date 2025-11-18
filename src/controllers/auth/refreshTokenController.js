import AbstractController from '../abstractController.js';
import { RefreshTokenService } from '../../services/auth/refreshTokenService.js';

export class RefreshTokenController extends AbstractController {
  constructor(req, res) {
    super(req, res);
  }

  async execute() {
    try {
      const { refreshToken } = this.req.body || {};

      if (!refreshToken) {
        return this.res.status(400).json({ message: 'validation.refresh_token_required' });
      }

      const token = await RefreshTokenService.handle(refreshToken);

      if (!token) {
        return this.res.status(401).json({ message: 'auth.refresh.unauthorized' });
      }

      return this.res.status(200).json(token);
    } catch (error) {
      return this.handleError(error, 'auth.refresh.error');
    }
  }

  static async handle(req, res) {
    const controller = new RefreshTokenController(req, res);
    await controller.execute();
  }
}
