import AbstractService from '../abstractService.js';
import AulaRepository from '../../repositories/aulaRepository.js';

export class UpdateAulaService extends AbstractService {
  constructor(Repository, id, data) {
    super(Repository);
    this.id = id;
    this.data = data;
  }

  async execute() {
    const data = {
      idAluno: this.data.idAluno,
      idProfessor: this.data.idProfessor,
      idContrato: this.data.idContrato,
      dataAula: this.data.dataAula,
      horaInicial: this.data.horaInicial,
      horaFinal: this.data.horaFinal,
      duracaoAula: this.data.duracaoAula,
      tipo: this.data.tipo,
      status: this.data.status,
      observacao: this.data.observacao
    };

    // remover campos undefined
    Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);

    return await this.repository.update({ id: this.id }, data, {
      select: this.repository.selectFields
    });
  }

  static async handle(id, data) {
    const Repository = AulaRepository;
    const service = new UpdateAulaService(Repository, id, data);
    return await service.execute();
  }
}
