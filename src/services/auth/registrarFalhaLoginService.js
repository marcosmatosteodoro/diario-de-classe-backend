import AbstractService from '../abstractService.js';
import TentativaLoginRepository from '../../repositories/tentativaLoginRepository.js';
import Constants from '../../utilities/constants.js';
import LoggerManager from '../../utilities/loggerManager.js';
import { buildLoginAttemptKeys } from '../../utilities/loginAttemptKeys.js';
import { maskEmail } from '../../utilities/maskEmail.js';

export class RegistrarFalhaLoginService extends AbstractService {
  constructor(Repository, ip, email) {
    super(Repository);
    this.ip = ip;
    this.email = email;
  }

  async execute() {
    const { chaveIpEmail, chaveIp } = buildLoginAttemptKeys(this.ip, this.email);
    const janela = Constants.loginJanelaSegundos;

    await Promise.all([
      this.repository.incrementar(chaveIpEmail, janela),
      this.repository.incrementar(chaveIp, janela)
    ]);

    LoggerManager.warn('Falha de login', { ip: this.ip, email: maskEmail(this.email) });
  }

  /**
   * Conta a falha nas chaves IP+e-mail e IP e registra a linha de log
   * (IP e e-mail mascarado; nunca a senha).
   * @param {string} ip
   * @param {string} email
   * @returns {Promise<void>}
   */
  static async handle(ip, email) {
    return await new RegistrarFalhaLoginService(TentativaLoginRepository, ip, email).execute();
  }
}
