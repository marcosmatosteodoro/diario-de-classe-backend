import AbstractService from '../abstractService.js';
import DisponibilidadeProfessorRepository from '../../repositories/disponibilidadeProfessorRepository.js';

export class IsDisponibilidadeProfessorDayExistsService extends AbstractService {
  constructor(Repository, diaDaSemana, id) {
    super(Repository);
    this.diaDaSemana = diaDaSemana;
    this.id = id;
  }

  async execute() {
    const disponibilidadeProfessor = await this.repository.selectOne({
      where: { diaDaSemana: this.diaDaSemana, id: this.id },
      select: { id: true }
    });

    return Boolean(disponibilidadeProfessor);
  }

  static async handle(diaDaSemana, id) {
    const Repository = DisponibilidadeProfessorRepository;
    const service = new IsDisponibilidadeProfessorDayExistsService(Repository, diaDaSemana, id);
    return await service.execute();
  }
}
