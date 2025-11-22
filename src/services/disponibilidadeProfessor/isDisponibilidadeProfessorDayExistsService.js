import AbstractService from '../abstractService.js';
import DisponibilidadeProfessorRepository from '../../repositories/disponibilidadeProfessorRepository.js';

export class IsDisponibilidadeProfessorDayExistsService extends AbstractService {
  constructor(Repository, diaSemana, id) {
    super(Repository);
    this.diaSemana = diaSemana;
    this.id = id;
  }

  async execute() {
    const disponibilidadeProfessor = await this.repository.selectOne({
      where: { diaSemana: this.diaSemana, id: this.id },
      select: { id: true }
    });

    return Boolean(disponibilidadeProfessor);
  }

  static async handle(diaSemana, id) {
    const Repository = DisponibilidadeProfessorRepository;
    const service = new IsDisponibilidadeProfessorDayExistsService(Repository, diaSemana, id);
    return await service.execute();
  }
}
