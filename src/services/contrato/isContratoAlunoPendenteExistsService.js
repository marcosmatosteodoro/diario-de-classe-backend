import AbstractService from '../abstractService.js';
import ContratoRepository from '../../repositories/contratoRepository.js';

export class IsContratoAlunoPendenteExistsService extends AbstractService {
  constructor(Repository, idAluno) {
    super(Repository);
    this.idAluno = idAluno;
  }

  async execute() {
    const contrato = await this.repository.selectOne({
      where: {
        idAluno: this.idAluno,
        status: 'PENDENTE'
      },
      select: { id: true }
    });

    return Boolean(contrato);
  }

  static async handle(idAluno) {
    const Repository = ContratoRepository;
    const service = new IsContratoAlunoPendenteExistsService(Repository, idAluno);
    return await service.execute();
  }
}
