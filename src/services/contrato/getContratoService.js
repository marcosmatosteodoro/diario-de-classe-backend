import AbstractService from '../abstractService.js';
import ContratoRepository from '../../repositories/contratoRepository.js';

export class GetContratoService extends AbstractService {
  constructor(Repository, id, params = {}) {
    super(Repository);
    this.id = id;
    this.select =
      params && params.withRelations
        ? this.repository.getSelectFieldsWithRelations()
        : this.repository.selectFields;
    this.where = {
      id: this.id,
      ...(params.additionalWhere || {})
    };
  }

  async execute() {
    return await this.repository.selectOne({
      where: this.where,
      select: this.select
    });
  }

  static async handle(id, params) {
    const Repository = ContratoRepository;
    const service = new GetContratoService(Repository, id, params);
    return await service.execute();
  }
}
