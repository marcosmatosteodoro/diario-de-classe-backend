import AbstractService from '../abstractService.js';
import DiaAulaRepository from '../../repositories/diaAulaRepository.js';

export class IsDiaAulaAlunoContratoExistsService extends AbstractService {
  constructor(Repository, { idAluno, idContrato }) {
    super(Repository);
    this.idAluno = idAluno;
    this.idContrato = idContrato;
  }

  async execute() {
    const diaAula = await this.repository.selectOne({
      where: {
        idAluno: this.idAluno,
        idContrato: this.idContrato
      },
      select: { id: true }
    });

    return Boolean(diaAula);
  }

  static async handle({ idAluno, idContrato }) {
    const Repository = DiaAulaRepository;
    const service = new IsDiaAulaAlunoContratoExistsService(Repository, { idAluno, idContrato });
    return await service.execute();
  }
}
