import AbstractService from '../abstractService.js';
import UserRepository from '../../repositories/userRepository.js';
import { createJwt } from '../../utilities/createJwt.js';
import Constants from '../../utilities/constants.js';

export class LoginService extends AbstractService {
  constructor(Repository, email, senha) {
    super(Repository);
    this.email = email;
    this.senha = senha;
  }

  async execute() {
    if (!this.email || !this.senha) {
      return null;
    }

    const user = await this.repository.selectOne({
      where: { email: this.email }
    });

    if (!user || user.senha !== this.senha) {
      return null;
    }

    this.buildToken(user);

    return {
      accessToken: this.accessToken,
      refreshToken: this.refreshToken,
      tokenType: 'Bearer',
      expiresIn: this.accessExp,
      user
    };
  }

  buildToken(user) {
    this.accessToken = createJwt(
      { sub: user.id, email: user.email },
      Constants.jwtSecret,
      Constants.accessExp
    );
    this.refreshToken = createJwt(
      { sub: user.id },
      Constants.jwtRefreshSecret,
      Constants.refreshExp
    );
    this.accessExp = Constants.accessExp;
  }

  static async handle(email, senha) {
    const Repository = UserRepository;
    const service = new LoginService(Repository, email, senha);
    return await service.execute();
  }
}
