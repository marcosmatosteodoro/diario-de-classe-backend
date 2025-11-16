import AbstractService from '../abstractService.js';
import ConfiguracaoRepository from '../../repositories/configuracaoRepository.js';

export class DeleteConfiguracaoService extends AbstractService {
  constructor(Repository, id) {
    super(Repository);
    this.id = id;
  }

  async execute() {
    return await this.repository.delete({ id: this.id });
  }

  static async handle(id) {
    const Repository = ConfiguracaoRepository;
    const service = new DeleteConfiguracaoService(Repository, id);
    return await service.execute();
  }
}
