import AbstractService from '../abstractService.js';
import UserRepository from '../../repositories/userRepository.js';
import { createJwt } from '../../utilities/createJwt.js';
import Constants from '../../utilities/constants.js';
import tokenRevocationManager from './tokenRevocationManagerService.js';
import { generatePayload } from '../../utilities/generatePayload.js';

export class RefreshTokenService extends AbstractService {
  constructor(Repository, refreshToken) {
    super(Repository);
    this.refreshToken = refreshToken;
  }

  async execute() {
    if (!this.refreshToken) {
      return null;
    }

    // Verifica se o token foi revogado
    if (tokenRevocationManager.isRevoked(this.refreshToken)) {
      return null;
    }

    // Valida o refresh token (decodifica e verifica assinatura)
    const decoded = this.verifyRefreshToken();
    if (!decoded) {
      return null;
    }

    // Busca o usuário para validar se ainda existe
    const user = await this.repository.selectOne({
      where: { id: decoded.sub }
    });

    if (!user) {
      return null;
    }

    // Gera novo access token
    const payload = generatePayload(user);
    const newAccessToken = createJwt(payload, Constants.jwtSecret, Constants.accessExp);

    return {
      accessToken: newAccessToken,
      tokenType: 'Bearer',
      expiresIn: Constants.accessExp
    };
  }

  verifyRefreshToken() {
    try {
      // Decodifica o refresh token manualmente
      const parts = this.refreshToken.split('.');
      if (parts.length !== 3) {
        return null;
      }

      const [, encodedPayload] = parts;
      const payloadJson = Buffer.from(encodedPayload, 'base64').toString('utf8');
      const payload = JSON.parse(payloadJson);

      // Verifica se expirou
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        return null;
      }

      return payload;
    } catch {
      return null;
    }
  }

  static async handle(refreshToken) {
    const Repository = UserRepository;
    const service = new RefreshTokenService(Repository, refreshToken);
    return await service.execute();
  }
}
