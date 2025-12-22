import AbstractService from '../abstractService.js';
import DiaAulaRepository from '../../repositories/diaAulaRepository.js';

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
