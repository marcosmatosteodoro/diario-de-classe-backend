import AbstractService from '../abstractService.js';
import SessaoLoginRepository from '../../repositories/sessaoLoginRepository.js';
import { verificarRefreshJwt } from '../../utilities/verificarRefreshJwt.js';

export class LogoutService extends AbstractService {
  constructor(Repository, refreshToken) {
    super(Repository);
    this.refreshToken = refreshToken;
  }

  /**
   * Encerra a sessão do login a que o refresh pertence (motivo `sair`), pelo `sid`. O `jti` é
   * ignorado: ele pode já ter sido trocado por outra aba ou por outro portador. Sair é
   * idempotente: sem cookie, com valor que não é um refresh válido, sem `sid` ou com a sessão já
   * encerrada não há o que encerrar e nada lança (o cookie chega do cliente).
   * @returns {Promise<{ revogado: boolean }>} `revogado` é `true` só se esta chamada encerrou a
   * sessão daquele login
   */
  async execute() {
    if (!this.refreshToken) return { revogado: false };

    const payload = verificarRefreshJwt(this.refreshToken);
    if (!payload || typeof payload.sid !== 'string' || !payload.sid) {
      return { revogado: false };
    }

    const encerrou = await this.repository.encerrar(payload.sid, 'sair');
    return { revogado: encerrou === true };
  }

  static async handle(refreshToken) {
    const Repository = SessaoLoginRepository;
    const service = new LogoutService(Repository, refreshToken);
    return await service.execute();
  }
}
