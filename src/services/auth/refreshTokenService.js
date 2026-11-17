import AbstractService from '../abstractService.js';
import UserRepository from '../../repositories/userRepository.js';
import { createJwt } from '../../utilities/createJwt.js';
import Constants from '../../utilities/constants.js';
import tokenRevocationManager from './tokenRevocationManagerService.js';
import { verifyJwt } from '../../utilities/verifyJwt.js';
import { generatePayload } from '../../utilities/generatePayload.js';
import { GetConfiguracaoService } from '../configuracao/getConfiguracaoService.js';

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

    // Busca o usuário para validar se ainda existe (senha fora da projeção)
    const user = await this.repository.selectOne({
      where: { id: decoded.sub },
      select: this.repository.selectFields
    });

    if (!this.usuarioPodeRenovar(user)) {
      return null;
    }

    // Gera novo access token
    const payload = generatePayload(user);
    const newAccessToken = createJwt(payload, Constants.jwtSecret, Constants.accessExp);

    const configuracoes = await GetConfiguracaoService.handle();

    return {
      accessToken: newAccessToken,
      tokenType: 'Bearer',
      expiresIn: Constants.accessExp,
      user,
      configuracao: configuracoes?.[0] ?? null
    };
  }

  /**
   * Gancho da decisão "este usuário pode renovar?". Hoje só exige que exista;
   * a desativação de usuário (Q-002-003) entra aqui.
   */
  usuarioPodeRenovar(user) {
    return Boolean(user);
  }

  verifyRefreshToken() {
    const payload = verifyJwt(this.refreshToken, Constants.jwtRefreshSecret);
    return payload || null;
  }

  static async handle(refreshToken) {
    const Repository = UserRepository;
    const service = new RefreshTokenService(Repository, refreshToken);
    return await service.execute();
  }
}
