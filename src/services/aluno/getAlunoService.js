import AbstractService from '../abstractService.js';
import AlunoRepository from '../../repositories/alunoRepository.js';

export class GetAlunoService extends AbstractService {
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
    const Repository = AlunoRepository;
    const service = new GetAlunoService(Repository, id);
    return await service.execute();
  }
}
