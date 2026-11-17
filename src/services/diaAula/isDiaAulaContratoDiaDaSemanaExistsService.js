import AbstractService from '../abstractService.js';
import DiaAulaRepository from '../../repositories/diaAulaRepository.js';

/**
 * Verifica se o aluno+contrato ja tem um dia de aula cadastrado no mesmo dia
 * da semana — impede duplicar `diaSemana`. Nao verifica sobreposicao de
 * horario entre dias diferentes: dois dias de aula do mesmo aluno+contrato em
 * dias da semana distintos, com `horaInicial`/`horaFinal` conflitantes, passam
 * por esta checagem sem erro.
 */
export class IsDiaAulaContratoDiaDaSemanaExistsService extends AbstractService {
  constructor(Repository, { idAluno, idContrato, diaSemana }) {
    super(Repository);
    this.idAluno = idAluno;
    this.idContrato = idContrato;
    this.diaSemana = diaSemana;
  }

  async execute() {
    const diaAula = await this.repository.selectMany({
      where: {
        idAluno: this.idAluno,
        idContrato: this.idContrato,
        diaSemana: this.diaSemana
      },
      select: { id: true }
    });

    return diaAula && diaAula.length > 0;
  }

  /**
   * @param {Object} params
   * @param {string} params.idAluno
   * @param {string} params.idContrato
   * @param {string} params.diaSemana `SEGUNDA`|`TERCA`|`QUARTA`|`QUINTA`|`SEXTA`|`SABADO`|`DOMINGO`
   * @returns {Promise<boolean>} true quando ja existe dia de aula desse aluno+contrato
   *   nesse mesmo `diaSemana`
   */
  static async handle({ idAluno, idContrato, diaSemana }) {
    const Repository = DiaAulaRepository;
    const service = new IsDiaAulaContratoDiaDaSemanaExistsService(Repository, {
      idAluno,
      idContrato,
      diaSemana
    });
    return await service.execute();
  }
}
