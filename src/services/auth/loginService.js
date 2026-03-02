import AbstractService from '../abstractService.js';
import UserRepository from '../../repositories/userRepository.js';
import { createJwt } from '../../utilities/createJwt.js';
import Constants from '../../utilities/constants.js';
import { GetConfiguracaoService } from '../configuracao/getConfiguracaoService.js';
import { generatePayload } from '../../utilities/generatePayload.js';

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

    const configuracoes = await GetConfiguracaoService.handle();

    if (!configuracoes || configuracoes.length === 0) {
      return this.res.status(204).json();
    }

    const configuracao = configuracoes[0];

    delete user.senha;

    return {
      accessToken: this.accessToken,
      refreshToken: this.refreshToken,
      tokenType: 'Bearer',
      expiresIn: this.accessExp,
      user,
      configuracao
    };
  }

  buildToken(user) {
    const payload = generatePayload(user);
    this.accessToken = createJwt(payload, Constants.jwtSecret, Constants.accessExp);
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
