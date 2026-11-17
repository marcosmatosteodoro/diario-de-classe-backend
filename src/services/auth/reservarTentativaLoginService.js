import AbstractService from '../abstractService.js';
import TentativaLoginRepository from '../../repositories/tentativaLoginRepository.js';
import Constants from '../../utilities/constants.js';
import { buildLoginAttemptKeys } from '../../utilities/loginAttemptKeys.js';

export class ReservarTentativaLoginService extends AbstractService {
  constructor(Repository, ip, email) {
    super(Repository);
    this.ip = ip;
    this.email = email;
  }

  /**
   * Conta a tentativa nas duas chaves e decide pelo valor devolvido pela própria escrita.
   * @returns {Promise<number>} segundos até a janela terminar; 0 se a tentativa está dentro do teto
   */
  async execute() {
    const { chaveIpEmail, chaveIp } = buildLoginAttemptKeys(this.ip, this.email);
    const janela = Constants.loginJanelaSegundos;
    const [porEmail, porIp] = await Promise.all([
      this.repository.incrementar(chaveIpEmail, janela),
      this.repository.incrementar(chaveIp, janela)
    ]);

    const restantes = [];
    if (porEmail.contagem > Constants.loginMaxTentativasPorEmail) {
      restantes.push(porEmail.segundosRestantes);
    }
    if (porIp.contagem > Constants.loginMaxTentativasPorIp) {
      restantes.push(porIp.segundosRestantes);
    }
    return restantes.length ? Math.max(1, ...restantes) : 0;
  }

  /**
   * @param {string} ip
   * @param {string} email
   * @returns {Promise<number>} segundos de bloqueio (0 = tentativa liberada)
   */
  static async handle(ip, email) {
    return await new ReservarTentativaLoginService(TentativaLoginRepository, ip, email).execute();
  }
}
