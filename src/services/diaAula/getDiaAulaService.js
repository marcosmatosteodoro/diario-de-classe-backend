import AbstractService from '../abstractService.js';
import DiaAulaRepository from '../../repositories/diaAulaRepository.js';

export class GetDiaAulaService extends AbstractService {
  constructor(Repository, id) {
    super(Repository);
    this.id = id;
  }

  async execute() {
    return await this.repository.selectOne({
      where: { id: this.id },
      select: this.repository.selectFields
    });
  }

  static async handle(id) {
    const Repository = DiaAulaRepository;
    const service = new GetDiaAulaService(Repository, id);
    return await service.execute();
  }
}
