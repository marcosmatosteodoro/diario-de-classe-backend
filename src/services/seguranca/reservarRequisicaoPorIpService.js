import AbstractService from '../abstractService.js';
import TentativaLoginRepository from '../../repositories/tentativaLoginRepository.js';
import Constants from '../../utilities/constants.js';

export class ReservarRequisicaoPorIpService extends AbstractService {
  constructor(Repository, ip) {
    super(Repository);
    this.ip = ip;
  }

  /**
   * Conta a requisição na chave `global:<ip>` e decide pelo valor devolvido pela própria
   * escrita (uma operação atômica, sem leitura prévia). IP indeterminado lança: não existe
   * chave comum de fallback, que faria origens distintas dividirem a mesma contagem.
   * @returns {Promise<{ permitido: boolean, segundosRestantes: number, primeiraRecusa: boolean }>}
   * @throws {Error} `ip_indeterminado` quando não há IP de origem
   */
  async execute() {
    if (!this.ip) throw new Error('ip_indeterminado');

    const { contagem, segundosRestantes } = await this.repository.incrementar(
      `global:${this.ip}`,
      Constants.rateLimitJanelaSegundos
    );
    const limite = Constants.rateLimitMaxRequisicoes;
    return {
      permitido: contagem <= limite,
      segundosRestantes,
      primeiraRecusa: contagem === limite + 1
    };
  }

  /**
   * @param {string} ip
   * @returns {Promise<{ permitido: boolean, segundosRestantes: number, primeiraRecusa: boolean }>}
   */
  static async handle(ip) {
    return await new ReservarRequisicaoPorIpService(TentativaLoginRepository, ip).execute();
  }
}
