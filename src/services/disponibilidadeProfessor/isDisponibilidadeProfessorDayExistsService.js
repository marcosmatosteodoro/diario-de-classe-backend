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

  /**
   * Sem consumidor hoje — nenhum controller ou middleware o chama.
   * @param {string} diaSemana `SEGUNDA`|`TERCA`|`QUARTA`|`QUINTA`|`SEXTA`|`SABADO`|`DOMINGO`
   * @param {string} id id do próprio registro de disponibilidade (não `userId`)
   * @returns {Promise<boolean>} true quando existe registro com esse `id` e `diaSemana`
   */
  static async handle(diaSemana, id) {
    const Repository = DisponibilidadeProfessorRepository;
    const service = new IsDisponibilidadeProfessorDayExistsService(Repository, diaSemana, id);
    return await service.execute();
  }
}
