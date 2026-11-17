import AbstractService from '../abstractService.js';
import TentativaLoginRepository from '../../repositories/tentativaLoginRepository.js';
import { buildLoginAttemptKeys } from '../../utilities/loginAttemptKeys.js';

export class ZerarTentativasLoginService extends AbstractService {
  constructor(Repository, ip, email) {
    super(Repository);
    this.ip = ip;
    this.email = email;
  }

  async execute() {
    const { chaveIpEmail } = buildLoginAttemptKeys(this.ip, this.email);
    await this.repository.removerPorChave(chaveIpEmail);
  }

  /**
   * Zera só o contador IP+e-mail; o contador por IP segue até a janela expirar.
   * @param {string} ip
   * @param {string} email
   * @returns {Promise<void>}
   */
  static async handle(ip, email) {
    return await new ZerarTentativasLoginService(TentativaLoginRepository, ip, email).execute();
  }
}
