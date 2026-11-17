import AbstractService from '../abstractService.js';
import ConfiguracaoRepository from '../../repositories/configuracaoRepository.js';

/**
 * Substitui configurações por uma nova de forma atômica: remoção e criação
 * acontecem na mesma transação do repository.
 */
export class SubstituirConfiguracaoService extends AbstractService {
  constructor(Repository, idsParaRemover, data) {
    super(Repository);
    this.idsParaRemover = idsParaRemover;
    this.data = data;
  }

  async execute() {
    return await this.repository.substituir(
      this.idsParaRemover,
      {
        duracaoAula: this.data.duracaoAula,
        tolerancia: this.data.tolerancia
      },
      { select: this.repository.selectFields }
    );
  }

  /**
   * @param {string[]} idsParaRemover - ids das configurações a remover
   * @param {Object} data
   * @param {number} data.duracaoAula - duração padrão da aula, em minutos
   * @param {number} data.tolerancia - tolerância de atraso, em minutos
   * @returns {Promise<Object>} configuração criada, com os campos de
   *   ConfiguracaoRepository.getSelectFields()
   */
  static async handle(idsParaRemover, data) {
    const Repository = ConfiguracaoRepository;
    const service = new SubstituirConfiguracaoService(Repository, idsParaRemover, data);
    return await service.execute();
  }
}
