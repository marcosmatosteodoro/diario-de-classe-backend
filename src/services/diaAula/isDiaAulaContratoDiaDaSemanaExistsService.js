import AbstractService from '../abstractService.js';
import DiaAulaRepository from '../../repositories/diaAulaRepository.js';

export class IsDiaAulaContratoDiaDaSemanaExistsService extends AbstractService {
  constructor(Repository, { idAluno, idContrato, diaDaSemana }) {
    super(Repository);
    this.idAluno = idAluno;
    this.idContrato = idContrato;
    this.diaDaSemana = diaDaSemana;
  }

  async execute() {
    const diaAula = await this.repository.selectOne({
      where: {
        idAluno: this.idAluno,
        idContrato: this.idContrato,
        diaDaSemana: this.diaDaSemana
      },
      select: { id: true }
    });

    return Boolean(diaAula);
  }

  static async handle({ idAluno, idContrato, diaDaSemana }) {
    const Repository = DiaAulaRepository;
    const service = new IsDiaAulaContratoDiaDaSemanaExistsService(Repository, {
      idAluno,
      idContrato,
      diaDaSemana
    });
    return await service.execute();
  }
}
