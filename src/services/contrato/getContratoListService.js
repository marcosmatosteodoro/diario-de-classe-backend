import AbstractService from '../abstractService.js';
import ContratoRepository from '../../repositories/contratoRepository.js';

export class GetContratoListService extends AbstractService {
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
    const Repository = ContratoRepository;
    const service = new GetContratoListService(Repository, where);
    return await service.execute();
  }
}
