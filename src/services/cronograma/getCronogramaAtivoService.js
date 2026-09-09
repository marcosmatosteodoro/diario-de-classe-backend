import AbstractService from '../abstractService.js';
import CronogramaAlunoRepository from '../../repositories/cronogramaAlunoRepository.js';

/**
 * Busca o cronograma ativo (livro em curso) de um contrato ou de um aluno.
 * O `additionalWhere` recebe o filtro de autorizacao dos controllers, para que
 * professor nao-admin nao alcance cronograma de aluno que nao e dele.
 */
export class GetCronogramaAtivoService extends AbstractService {
  constructor(Repository, { idContrato, idAluno }, additionalWhere) {
    super(Repository);
    this.where = { ativo: true, ...additionalWhere };

    if (idContrato) {
      this.where.idContrato = idContrato;
    }

    if (idAluno) {
      this.where.idAluno = idAluno;
    }
  }

  async execute() {
    const [cronograma] = await this.repository.selectMany({
      where: this.where,
      select: this.repository.getSelectFieldsWithLivro(),
      // A unicidade de "um livro ativo" e por contrato, nao por aluno: um aluno
      // com contrato de ingles e de espanhol tem dois ativos legitimamente.
      // Sem ordenacao, a busca por aluno devolvia um dos dois a esmo.
      orderBy: { dataInicio: 'desc' },
      take: 1
    });

    return cronograma || null;
  }

  static async handle({ idContrato = null, idAluno = null }, additionalWhere = {}) {
    const Repository = CronogramaAlunoRepository;
    const service = new GetCronogramaAtivoService(
      Repository,
      { idContrato, idAluno },
      additionalWhere
    );
    return await service.execute();
  }
}
