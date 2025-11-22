import AbstractService from '../abstractService.js';
import AulaRepository from '../../repositories/aulaRepository.js';

export class IsAulaExistsService extends AbstractService {
  constructor(Repository, { idAluno, idProfessor, idContrato }) {
    super(Repository);
    this.idAluno = idAluno;
    this.idProfessor = idProfessor;
    this.idContrato = idContrato;
  }

  async execute() {
    const aula = await this.repository.selectOne({
      where: {
        idAluno: this.idAluno,
        idProfessor: this.idProfessor,
        idContrato: this.idContrato
      },
      select: { id: true }
    });

    return Boolean(aula);
  }

  static async handle({ idAluno, idProfessor, idContrato }) {
    const Repository = AulaRepository;
    const service = new IsAulaExistsService(Repository, { idAluno, idProfessor, idContrato });
    return await service.execute();
  }
}
