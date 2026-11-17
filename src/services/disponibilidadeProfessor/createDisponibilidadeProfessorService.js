import AbstractService from '../abstractService.js';
import DisponibilidadeProfessorRepository from '../../repositories/disponibilidadeProfessorRepository.js';

export class CreateDisponibilidadeProfessorService extends AbstractService {
  constructor(Repository, data) {
    super(Repository);
    this.data = data;
  }

  async execute() {
    return await this.repository.create(
      {
        diaSemana: this.data.diaSemana,
        horaInicial: this.data.horaInicial,
        horaFinal: this.data.horaFinal,
        ativo: this.data.ativo,
        userId: this.data.userId
      },
      {
        select: this.repository.selectFields
      }
    );
  }

  /**
   * @param {Object} data
   * @param {string} data.diaSemana `SEGUNDA`|`TERCA`|`QUARTA`|`QUINTA`|`SEXTA`|`SABADO`|`DOMINGO`
   * @param {string} data.horaInicial formato `HH:MM`, validado só no middleware de entrada
   * @param {string} data.horaFinal formato `HH:MM`
   * @param {boolean} data.ativo
   * @param {string} data.userId professor ao qual o registro pertence
   * @returns {Promise<Object>} disponibilidade criada
   */
  static async handle(data) {
    const Repository = DisponibilidadeProfessorRepository;
    const service = new CreateDisponibilidadeProfessorService(Repository, data);
    return await service.execute();
  }
}
