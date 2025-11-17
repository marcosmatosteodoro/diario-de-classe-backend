import AbstractService from '../abstractService.js';
import DisponibilidadeProfessorRepository from '../../repositories/disponibilidadeProfessorRepository.js';

export class UpdateDisponibilidadeProfessorService extends AbstractService {
  constructor(Repository, id, data) {
    super(Repository);
    this.id = id;
    this.data = data;
  }

  async execute() {
    const data = {
      diaDaSemana: this.data.diaDaSemana,
      horaInicial: this.data.horaInicial,
      horaFinal: this.data.horaFinal,
      ativo: this.data.ativo,
      userId: this.data.userId
    };

    // remover campos undefined
    Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);

    return await this.repository.update({ id: this.id }, data, {
      select: this.repository.selectFields
    });
  }

  static async handle(id, data) {
    const Repository = DisponibilidadeProfessorRepository;
    const service = new UpdateDisponibilidadeProfessorService(Repository, id, data);
    return await service.execute();
  }
}
