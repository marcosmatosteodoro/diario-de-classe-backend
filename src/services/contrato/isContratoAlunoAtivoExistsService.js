import AbstractService from '../abstractService.js';
import ContratoRepository from '../../repositories/contratoRepository.js';

export class IsContratoAlunoAtivoExistsService extends AbstractService {
  constructor(Repository, idDoAluno) {
    super(Repository);
    this.idDoAluno = idDoAluno;
  }

  async execute() {
    const contrato = await this.repository.selectMany({
      where: {
        idDoAluno: this.idDoAluno,
        status: 'ATIVO'
      },
      select: { id: true }
    });

    return contrato && contrato.length > 0;
  }

  static async handle(idDoAluno) {
    const Repository = ContratoRepository;
    const service = new IsContratoAlunoAtivoExistsService(Repository, idDoAluno);
    return await service.execute();
  }
}
