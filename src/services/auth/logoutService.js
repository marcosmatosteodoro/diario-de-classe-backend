import AbstractService from '../abstractService.js';
import UserRepository from '../../repositories/userRepository.js';
import tokenRevocationManager from './tokenRevocationManagerService.js';

export class LogoutService extends AbstractService {
  constructor(Repository, refreshToken) {
    super(Repository);
    this.refreshToken = refreshToken;
  }

  async execute() {
    if (!this.refreshToken) {
      return null;
    }

    if (tokenRevocationManager.isRevoked(this.refreshToken)) {
      return null;
    }

    tokenRevocationManager.revoke(this.refreshToken);

    return {
      message: 'auth.logout.success',
      success: true
    };
  }

  static async handle(refreshToken) {
    const Repository = UserRepository;
    const service = new LogoutService(Repository, refreshToken);
    return await service.execute();
  }
}
