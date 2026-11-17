import AbstractService from '../abstractService.js';
import ConfiguracaoRepository from '../../repositories/configuracaoRepository.js';

export class UpdateConfiguracaoService extends AbstractService {
  constructor(Repository, id, data) {
    super(Repository);
    this.id = id;
    this.data = data;
  }

  async execute() {
    const data = {
      duracaoAula: this.data.duracaoAula,
      tolerancia: this.data.tolerancia,
      diasDeFuncionamento: this.data.diasDeFuncionamento
    };

    // remover campos undefined
    Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);

    return await this.repository.update({ id: this.id }, data, {
      select: this.repository.selectFields
    });
  }

  /**
   * @param {string} id
   * @param {Object} data
   * @param {number} [data.duracaoAula] - duração padrão da aula, em minutos;
   *   consumida por controllers de dia de aula e de contrato para calcular
   *   horaFinal a partir de horaInicial
   * @param {number} [data.tolerancia] - tolerância de atraso, em minutos;
   *   armazenada e editável, mas sem consumidor encontrado fora deste CRUD
   * @param {Array<Object>} [data.diasDeFuncionamento] - dias de funcionamento
   *   a vincular (campo relacional; ignorado se undefined)
   * @returns {Promise<Object>} configuração atualizada, com os campos de
   *   ConfiguracaoRepository.getSelectFields()
   */
  static async handle(id, data) {
    const Repository = ConfiguracaoRepository;
    const service = new UpdateConfiguracaoService(Repository, id, data);
    return await service.execute();
  }
}
