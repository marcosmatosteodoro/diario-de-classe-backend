import AbstractService from '../abstractService.js';
import ContratoRepository from '../../repositories/contratoRepository.js';

export class UpdateContratoService extends AbstractService {
  constructor(Repository, id, data) {
    super(Repository);
    this.id = id;
    this.data = data;
  }

  async execute() {
    const data = {
      idAluno: this.data.idAluno,
      dataInicio: this.data.dataInicio,
      dataTermino: this.data.dataTermino,
      status: this.data.status,
      totalAulas: this.data.totalAulas,
      totalAulasFeitas: this.data.totalAulasFeitas,
      totalReposicoes: this.data.totalReposicoes,
      totalFaltas: this.data.totalFaltas,
      totalAulasCanceladas: this.data.totalAulasCanceladas
    };

    // remover campos undefined
    Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);

    return await this.repository.update({ id: this.id }, data, {
      select: this.repository.selectFields
    });
  }

  static async handle(id, data) {
    const Repository = ContratoRepository;
    const service = new UpdateContratoService(Repository, id, data);
    return await service.execute();
  }
}
