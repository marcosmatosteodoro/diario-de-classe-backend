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
   * Reserva a tentativa em sequência e decide pelo valor devolvido pela própria escrita.
   * IP primeiro: acima do teto do IP a chave IP+e-mail nem é criada (sem crescimento
   * por e-mails novos). Toda recusa devolve a reserva do IP, para que tentativa
   * bloqueada não consuma o teto de quem divide o IP.
   * @returns {Promise<number>} segundos até a janela que recusou terminar; 0 se liberada
   */
  async execute() {
    const { chaveIpEmail, chaveIp } = buildLoginAttemptKeys(this.ip, this.email);
    const janela = Constants.loginJanelaSegundos;

    const porIp = await this.repository.incrementar(chaveIp, janela);
    if (porIp.contagem > Constants.loginMaxTentativasPorIp) {
      await this.repository.decrementar(chaveIp);
      return porIp.segundosRestantes;
    }

    const porEmail = await this.repository.incrementar(chaveIpEmail, janela);
    if (porEmail.contagem > Constants.loginMaxTentativasPorEmail) {
      await this.repository.decrementar(chaveIp);
      return porEmail.segundosRestantes;
    }
    return 0;
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
