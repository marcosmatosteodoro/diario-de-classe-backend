import AbstractService from '../abstractService.js';
import DisponibilidadeProfessorRepository from '../../repositories/disponibilidadeProfessorRepository.js';

export class GetDisponibilidadeProfessorService extends AbstractService {
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
    const Repository = DisponibilidadeProfessorRepository;
    const service = new GetDisponibilidadeProfessorService(Repository, id);
    return await service.execute();
  }
}
