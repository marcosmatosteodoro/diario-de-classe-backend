import AbstractService from '../abstractService.js';
import ConfiguracaoRepository from '../../repositories/configuracaoRepository.js';

export class GetConfiguracaoListService extends AbstractService {
  constructor(Repository, where) {
    super(Repository);
    this.where = where;
  }

  async execute() {
    return await this.repository.selectMany({
      select: this.repository.selectFields,
      where: this.where
    });
  }

  static async handle(where = {}) {
    const Repository = ConfiguracaoRepository;
    const service = new GetConfiguracaoListService(Repository, where);
    return await service.execute();
  }
}
