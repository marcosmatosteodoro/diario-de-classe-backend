import AbstractService from '../abstractService.js';
import AlunoRepository from '../../repositories/alunoRepository.js';

export class DeleteAlunoService extends AbstractService {
  constructor(Repository, id) {
    super(Repository);
    this.id = id;
  }

  async execute() {
    return await this.repository.delete({ id: this.id });
  }

  static async handle(id) {
    const Repository = AlunoRepository;
    const service = new DeleteAlunoService(Repository, id);
    return await service.execute();
  }
}
