import AbstractService from '../abstractService.js';
import DiaAulaRepository from '../../repositories/diaAulaRepository.js';

export class IsDiaAulaAlunoContratoExistsService extends AbstractService {
  constructor(Repository, { idAluno, idContrato }) {
    super(Repository);
    this.idAluno = idAluno;
    this.idContrato = idContrato;
  }

  async execute() {
    const diaAula = await this.repository.selectMany({
      where: {
        idAluno: this.idAluno,
        idContrato: this.idContrato
      },
      select: { id: true }
    });

    return diaAula && diaAula.length > 0;
  }

  /**
   * @param {Object} params
   * @param {string} params.idAluno
   * @param {string} params.idContrato
   * @returns {Promise<boolean>} true quando ha ao menos um dia de aula para esse aluno+contrato,
   *   em qualquer dia da semana
   */
  static async handle({ idAluno, idContrato }) {
    const Repository = DiaAulaRepository;
    const service = new IsDiaAulaAlunoContratoExistsService(Repository, { idAluno, idContrato });
    return await service.execute();
  }
}
