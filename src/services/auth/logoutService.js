import AbstractService from '../abstractService.js';
import UserRepository from '../../repositories/userRepository.js';
import { verificarRefreshJwt } from '../../utilities/verificarRefreshJwt.js';
import tokenRevocationManager from './tokenRevocationManagerService.js';

export class LogoutService extends AbstractService {
  constructor(Repository, refreshToken) {
    super(Repository);
    this.refreshToken = refreshToken;
  }

  /**
   * Sair é idempotente: sem token, com token já revogado ou com valor que não é um
   * refresh válido não há o que revogar e nada lança (o cookie chega do cliente: gravar
   * qualquer valor na lista de revogados seria memória ilimitada).
   * @returns {Promise<{ revogado: boolean }>}
   */
  async execute() {
    if (
      !this.refreshToken ||
      !verificarRefreshJwt(this.refreshToken) ||
      tokenRevocationManager.isRevoked(this.refreshToken)
    ) {
      return { revogado: false };
    }

    tokenRevocationManager.revoke(this.refreshToken);

    return { revogado: true };
  }

  static async handle(refreshToken) {
    const Repository = UserRepository;
    const service = new LogoutService(Repository, refreshToken);
    return await service.execute();
  }
}
