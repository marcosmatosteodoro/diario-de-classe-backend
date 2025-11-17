import AbstractService from '../abstractService.js';
import DisponibilidadeProfessorRepository from '../../repositories/disponibilidadeProfessorRepository.js';

export class DeleteDisponibilidadeProfessorService extends AbstractService {
  constructor(Repository, id) {
    super(Repository);
    this.id = id;
  }

  async execute() {
    return await this.repository.delete({ id: this.id });
  }

  static async handle(id) {
    const Repository = DisponibilidadeProfessorRepository;
    const service = new DeleteDisponibilidadeProfessorService(Repository, id);
    return await service.execute();
  }
}
