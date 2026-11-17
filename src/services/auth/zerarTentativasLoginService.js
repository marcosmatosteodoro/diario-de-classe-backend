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
    const { chaveIpEmail, chaveIp } = buildLoginAttemptKeys(this.ip, this.email);
    await Promise.all([
      this.repository.removerPorChave(chaveIpEmail),
      this.repository.decrementar(chaveIp)
    ]);
  }

  /**
   * Login legítimo: apaga o contador IP+e-mail e devolve a tentativa reservada
   * ao contador por IP, para não consumir o teto de quem divide o IP.
   * @param {string} ip
   * @param {string} email
   * @returns {Promise<void>}
   */
  static async handle(ip, email) {
    return await new ZerarTentativasLoginService(TentativaLoginRepository, ip, email).execute();
  }
}
