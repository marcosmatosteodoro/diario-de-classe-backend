import AbstractService from '../abstractService.js';
import DiaAulaRepository from '../../repositories/diaAulaRepository.js';

export class GetDiaAulaService extends AbstractService {
  constructor(Repository, id, additionalWhere) {
    super(Repository);
    this.where = { id, ...additionalWhere };
  }

  async execute() {
    return await this.repository.selectOne({
      where: this.where,
      select: this.repository.selectFields
    });
  }

  static async handle(id, additionalWhere = {}) {
    const Repository = DiaAulaRepository;
    const service = new GetDiaAulaService(Repository, id, additionalWhere);
    return await service.execute();
  }
}
