import AbstractService from '../abstractService.js';
import ConfiguracaoRepository from '../../repositories/configuracaoRepository.js';

export class CreateConfiguracaoService extends AbstractService {
  constructor(Repository, data) {
    super(Repository);
    this.data = data;
  }

  async execute() {
    const data = {
      duracaoDaAula: this.data.duracaoDaAula,
      tolerancia: this.data.tolerancia,
      diasDeFuncionamento: this.data.diasDeFuncionamento
    };

    // remover campos undefined
    Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);

    return await this.repository.create(data, {
      select: this.repository.selectFields
    });
  }

  static async handle(data) {
    const Repository = ConfiguracaoRepository;
    const service = new CreateConfiguracaoService(Repository, data);
    return await service.execute();
  }
}
