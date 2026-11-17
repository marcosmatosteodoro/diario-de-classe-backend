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
   * bloqueada não consuma o teto de quem divide o IP; a devolução só vale na janela
   * em que a reserva foi feita (`expiraEm`).
   * @returns {Promise<{ segundosBloqueio: number, expiraEmIp: string }>} segundos até
   *   a janela que recusou terminar (0 se liberada) e o fim da janela da reserva do IP
   */
  async execute() {
    const { chaveIpEmail, chaveIp } = buildLoginAttemptKeys(this.ip, this.email);
    const janela = Constants.loginJanelaSegundos;

    const porIp = await this.repository.incrementar(chaveIp, janela);
    if (porIp.contagem > Constants.loginMaxTentativasPorIp) {
      await this.repository.decrementar(chaveIp, porIp.expiraEm);
      return { segundosBloqueio: porIp.segundosRestantes, expiraEmIp: porIp.expiraEm };
    }

    const porEmail = await this.repository.incrementar(chaveIpEmail, janela);
    if (porEmail.contagem > Constants.loginMaxTentativasPorEmail) {
      await this.repository.decrementar(chaveIp, porIp.expiraEm);
      return { segundosBloqueio: porEmail.segundosRestantes, expiraEmIp: porIp.expiraEm };
    }
    return { segundosBloqueio: 0, expiraEmIp: porIp.expiraEm };
  }

  /**
   * @param {string} ip
   * @param {string} email
   * @returns {Promise<{ segundosBloqueio: number, expiraEmIp: string }>}
   */
  static async handle(ip, email) {
    return await new ReservarTentativaLoginService(TentativaLoginRepository, ip, email).execute();
  }
}
