import AbstractService from '../abstractService.js';
import ContratoRepository from '../../repositories/contratoRepository.js';

export class CreateContratoService extends AbstractService {
  constructor(Repository, data) {
    super(Repository);
    this.data = data;
  }

  async execute() {
    return await this.repository.create(
      {
        idDoAluno: this.data.idDoAluno,
        dataDeInicio: this.data.dataDeInicio,
        dataDeTermino: this.data.dataDeTermino,
        status: 'PENDENTE',
        totalAulas: 0,
        totalAulasFeitas: 0,
        totalReposicoes: 0,
        totalFaltas: 0,
        totalAulasCanceladas: 0
      },
      {
        select: this.repository.selectFields
      }
    );
  }

  static async handle(data) {
    const Repository = ContratoRepository;
    const service = new CreateContratoService(Repository, data);
    return await service.execute();
  }
}
