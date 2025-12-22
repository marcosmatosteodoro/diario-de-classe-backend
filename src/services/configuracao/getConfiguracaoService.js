import AbstractService from '../abstractService.js';
import ConfiguracaoRepository from '../../repositories/configuracaoRepository.js';

export class GetConfiguracaoService extends AbstractService {
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
    const service = new GetConfiguracaoService(Repository, where);
    return await service.execute();
  }
}
