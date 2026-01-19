import AbstractService from '../abstractService.js';
import AlunoRepository from '../../repositories/alunoRepository.js';

export class GetAlunoService extends AbstractService {
  constructor(Repository, id, additionalWhere = {}) {
    super(Repository);
    this.where = {
      id: id,
      ...additionalWhere
    };
  }

  async execute() {
    return await this.repository.selectOne({
      where: this.where,
      select: this.repository.selectFields
    });
  }

  static async handle(id, additionalWhere = {}) {
    const Repository = AlunoRepository;
    const service = new GetAlunoService(Repository, id, additionalWhere);
    return await service.execute();
  }
}
