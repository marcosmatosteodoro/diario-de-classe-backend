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

  static async handle(id, data) {
    const Repository = ConfiguracaoRepository;
    const service = new UpdateConfiguracaoService(Repository, id, data);
    return await service.execute();
  }
}
