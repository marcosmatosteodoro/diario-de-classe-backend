import AbstractService from '../abstractService.js';
import ConfiguracaoRepository from '../../repositories/configuracaoRepository.js';

export class CreateConfiguracaoService extends AbstractService {
  constructor(Repository, data) {
    super(Repository);
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

    return await this.repository.create(data, {
      select: this.repository.selectFields
    });
  }

  /**
   * @param {Object} data
   * @param {number} [data.duracaoAula] - duração padrão da aula, em minutos;
   *   consumida por controllers de dia de aula e de contrato para calcular
   *   horaFinal a partir de horaInicial
   * @param {number} [data.tolerancia] - tolerância de atraso, em minutos;
   *   armazenada e editável, mas sem consumidor encontrado fora deste CRUD
   * @param {Array<Object>} [data.diasDeFuncionamento] - dias de funcionamento
   *   a vincular (campo relacional; ignorado se undefined)
   * @returns {Promise<Object>} configuração criada, com os campos de
   *   ConfiguracaoRepository.getSelectFields()
   */
  static async handle(data) {
    const Repository = ConfiguracaoRepository;
    const service = new CreateConfiguracaoService(Repository, data);
    return await service.execute();
  }
}
