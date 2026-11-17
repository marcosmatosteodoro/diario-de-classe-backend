import AbstractService from '../abstractService.js';
import ContratoRepository from '../../repositories/contratoRepository.js';

export class IsContratoAlunoAtivoExistsService extends AbstractService {
  constructor(Repository, idAluno) {
    super(Repository);
    this.idAluno = idAluno;
  }

  async execute() {
    const contrato = await this.repository.selectMany({
      where: {
        idAluno: this.idAluno,
        status: 'ATIVO'
      },
      select: { id: true }
    });

    return contrato && contrato.length > 0;
  }

  /**
   * @param {string} idAluno
   * @returns {Promise<boolean>} true quando o aluno tem ao menos um contrato `ATIVO`.
   *   Chamado hoje só na criação de contrato — não é reconferido no delete do aluno.
   */
  static async handle(idAluno) {
    const Repository = ContratoRepository;
    const service = new IsContratoAlunoAtivoExistsService(Repository, idAluno);
    return await service.execute();
  }
}
