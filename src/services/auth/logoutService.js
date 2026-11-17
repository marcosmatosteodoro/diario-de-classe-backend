import AbstractService from '../abstractService.js';
import UserRepository from '../../repositories/userRepository.js';
import tokenRevocationManager from './tokenRevocationManagerService.js';

export class LogoutService extends AbstractService {
  constructor(Repository, refreshToken) {
    super(Repository);
    this.refreshToken = refreshToken;
  }

  /**
   * Sair é idempotente: sem token ou com token já revogado não há o que revogar e
   * nada lança.
   * @returns {Promise<{ revogado: boolean }>}
   */
  async execute() {
    if (!this.refreshToken || tokenRevocationManager.isRevoked(this.refreshToken)) {
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
