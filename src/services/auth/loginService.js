import AbstractService from '../abstractService.js';
import UserRepository from '../../repositories/userRepository.js';
import { createJwt } from '../../utilities/createJwt.js';
import Constants from '../../utilities/constants.js';
import { GetConfiguracaoService } from '../configuracao/getConfiguracaoService.js';
import { generatePayload } from '../../utilities/generatePayload.js';
import LoggerManager from '../../utilities/loggerManager.js';
import {
  hashSenha,
  isHash,
  textoIgualEmTempoConstante,
  verificarSenha
} from '../../utilities/password.js';

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

    if (!user || !(await this.senhaConfere(user))) {
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

  /**
   * Fail secure: qualquer exceção na verificação nega o login.
   * Senha gravada em texto puro (legado) é comparada uma última vez e, se
   * bater, regravada como hash; falha na regravação não derruba o login.
   * @returns {Promise<boolean>}
   */
  async senhaConfere(user) {
    try {
      if (isHash(user.senha)) {
        return await verificarSenha(this.senha, user.senha);
      }

      if (!textoIgualEmTempoConstante(user.senha, this.senha)) {
        return false;
      }
    } catch {
      return false;
    }

    await this.regravarComoHash(user);
    return true;
  }

  async regravarComoHash(user) {
    try {
      const senha = await hashSenha(this.senha);
      await this.repository.update({ id: user.id }, { senha }, { select: { id: true } });
    } catch (error) {
      // Só name/code: a mensagem de erro do ORM pode embutir os argumentos da chamada.
      LoggerManager.error('[LoginService] Falha ao regravar credencial como hash', {
        name: error?.name,
        code: error?.code
      });
    }
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
