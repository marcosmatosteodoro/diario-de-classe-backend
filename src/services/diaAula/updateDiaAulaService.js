import AbstractService from '../abstractService.js';
import DiaAulaRepository from '../../repositories/diaAulaRepository.js';

export class UpdateDiaAulaService extends AbstractService {
  constructor(Repository, id, data) {
    super(Repository);
    this.id = id;
    this.data = data;
  }

  async execute() {
    const data = {
      idAluno: this.data.idAluno,
      idContrato: this.data.idContrato,
      diaSemana: this.data.diaSemana,
      quantidadeAulas: this.data.quantidadeAulas,
      duracaoAula: this.data.duracaoAula,
      horaInicial: this.data.horaInicial,
      horaFinal: this.data.horaFinal
    };

    // remover campos undefined
    Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);

    return await this.repository.update({ id: this.id }, data, {
      select: this.repository.selectFields
    });
  }

  static async handle(id, data) {
    const Repository = DiaAulaRepository;
    const service = new UpdateDiaAulaService(Repository, id, data);
    return await service.execute();
  }
}
