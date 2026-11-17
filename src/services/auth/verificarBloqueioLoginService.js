import AbstractService from '../abstractService.js';
import TentativaLoginRepository from '../../repositories/tentativaLoginRepository.js';
import Constants from '../../utilities/constants.js';
import { buildLoginAttemptKeys } from '../../utilities/loginAttemptKeys.js';

export class VerificarBloqueioLoginService extends AbstractService {
  constructor(Repository, ip, email) {
    super(Repository);
    this.ip = ip;
    this.email = email;
  }

  /**
   * @returns {Promise<number>} segundos até a janela bloqueante terminar; 0 se não há bloqueio
   */
  async execute() {
    const { chaveIpEmail, chaveIp } = buildLoginAttemptKeys(this.ip, this.email);
    const [porEmail, porIp] = await Promise.all([
      this.repository.buscarPorChave(chaveIpEmail),
      this.repository.buscarPorChave(chaveIp)
    ]);

    return Math.max(
      this.segundosRestantes(porEmail, Constants.loginMaxTentativasPorEmail),
      this.segundosRestantes(porIp, Constants.loginMaxTentativasPorIp)
    );
  }

  segundosRestantes(registro, limite) {
    if (!registro || registro.contagem < limite) {
      return 0;
    }
    const restanteMs = new Date(registro.expiraEm).getTime() - Date.now();
    return restanteMs > 0 ? Math.ceil(restanteMs / 1000) : 0;
  }

  /**
   * @param {string} ip
   * @param {string} email
   * @returns {Promise<number>} segundos de bloqueio restantes (0 = liberado)
   */
  static async handle(ip, email) {
    return await new VerificarBloqueioLoginService(TentativaLoginRepository, ip, email).execute();
  }
}
