import AbstractService from '../abstractService.js';
import AulaRepository from '../../repositories/aulaRepository.js';

export class IsAulaExistsService extends AbstractService {
  constructor(Repository, { idAluno, idProfessor, idContrato, dataAula }) {
    super(Repository);
    this.idAluno = idAluno;
    this.idProfessor = idProfessor;
    this.idContrato = idContrato;
    this.dataAula = dataAula;
  }

  async execute() {
    const aula = await this.repository.selectOne({
      where: {
        idAluno: this.idAluno,
        idProfessor: this.idProfessor,
        idContrato: this.idContrato,
        dataAula: this.dataAula
      },
      select: { id: true }
    });

    return Boolean(aula);
  }

  static async handle(params) {
    const Repository = AulaRepository;
    const service = new IsAulaExistsService(Repository, params);
    return await service.execute();
  }
}
