import AbstractService from '../abstractService.js';
import CronogramaAlunoRepository from '../../repositories/cronogramaAlunoRepository.js';

/**
 * Historico de livros do aluno, do mais recente para o mais antigo.
 */
export class GetCronogramaListByAlunoService extends AbstractService {
  constructor(Repository, idAluno, additionalWhere) {
    super(Repository);
    this.where = { idAluno, ...additionalWhere };
  }

  async execute() {
    return await this.repository.selectMany({
      where: this.where,
      select: this.repository.getSelectFieldsWithLivro(),
      orderBy: { dataInicio: 'desc' }
    });
  }

  static async handle(idAluno, additionalWhere = {}) {
    const Repository = CronogramaAlunoRepository;
    const service = new GetCronogramaListByAlunoService(Repository, idAluno, additionalWhere);
    return await service.execute();
  }
}
