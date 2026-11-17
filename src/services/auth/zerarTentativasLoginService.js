import AbstractService from '../abstractService.js';
import TentativaLoginRepository from '../../repositories/tentativaLoginRepository.js';
import { buildLoginAttemptKeys } from '../../utilities/loginAttemptKeys.js';

export class ZerarTentativasLoginService extends AbstractService {
  constructor(Repository, ip, email, expiraEmIp) {
    super(Repository);
    this.expiraEmIp = expiraEmIp;
    this.ip = ip;
    this.email = email;
  }

  async execute() {
    const { chaveIpEmail, chaveIp } = buildLoginAttemptKeys(this.ip, this.email);
    // Sem o fim da janela da reserva não há como devolver sem risco de atingir outra
    // janela: não devolve (lado de recusar).
    const devolverIp =
      this.expiraEmIp === undefined || this.expiraEmIp === null
        ? Promise.resolve(0)
        : this.repository.decrementar(chaveIp, this.expiraEmIp);
    await Promise.all([this.repository.removerPorChave(chaveIpEmail), devolverIp]);
  }

  /**
   * Login legítimo: apaga o contador IP+e-mail e devolve a tentativa reservada
   * ao contador por IP, para não consumir o teto de quem divide o IP. A devolução só
   * vale na janela da reserva (`expiraEmIp`); ausente, o IP não é devolvido.
   * @param {string} ip
   * @param {string} email
   * @param {string} [expiraEmIp] - fim da janela da reserva do IP
   * @returns {Promise<void>}
   */
  static async handle(ip, email, expiraEmIp) {
    return await new ZerarTentativasLoginService(
      TentativaLoginRepository,
      ip,
      email,
      expiraEmIp
    ).execute();
  }
}
