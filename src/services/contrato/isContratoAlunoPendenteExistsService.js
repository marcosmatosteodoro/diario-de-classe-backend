import AbstractService from '../abstractService.js';
import ContratoRepository from '../../repositories/contratoRepository.js';

export class IsContratoAlunoPendenteExistsService extends AbstractService {
  constructor(Repository, idAluno) {
    super(Repository);
    this.idAluno = idAluno;
  }

  async execute() {
    const contrato = await this.repository.selectMany({
      where: {
        idAluno: this.idAluno,
        status: 'PENDENTE'
      },
      select: { id: true }
    });

    return contrato && contrato.length > 0;
  }

  /**
   * @param {string} idAluno
   * @returns {Promise<boolean>} true quando o aluno tem ao menos um contrato `PENDENTE`
   */
  static async handle(idAluno) {
    const Repository = ContratoRepository;
    const service = new IsContratoAlunoPendenteExistsService(Repository, idAluno);
    return await service.execute();
  }
}
