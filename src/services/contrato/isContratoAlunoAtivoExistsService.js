import AbstractService from '../abstractService.js';
import ContratoRepository from '../../repositories/contratoRepository.js';

export class IsContratoAlunoAtivoExistsService extends AbstractService {
  constructor(Repository, idAluno) {
    super(Repository);
    this.idAluno = idAluno;
  }

  async execute() {
    const contrato = await this.repository.selectOne({
      where: {
        idAluno: this.idAluno,
        status: 'ATIVO'
      },
      select: { id: true }
    });

    return Boolean(contrato);
  }

  static async handle(idAluno) {
    const Repository = ContratoRepository;
    const service = new IsContratoAlunoAtivoExistsService(Repository, idAluno);
    return await service.execute();
  }
}
