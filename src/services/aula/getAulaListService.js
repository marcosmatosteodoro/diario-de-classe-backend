import AbstractService from '../abstractService.js';
import AulaRepository from '../../repositories/aulaRepository.js';

export class GetAulaListService extends AbstractService {
  constructor(Repository, where, params) {
    super(Repository);
    this.where = where;
    this.select =
      params && params.withRelations
        ? this.repository.getSelectFieldsWithRelations()
        : this.repository.selectFields;
  }

  async execute() {
    return await this.repository.selectMany({
      select: this.repository.getSelectFieldsWithRelations(),
      where: this.where,
      orderBy: { dataAula: 'asc' }
    });
  }

  static async handle(where = {}, params = {}) {
    const Repository = AulaRepository;
    const service = new GetAulaListService(Repository, where, params);
    return await service.execute();
  }
}
