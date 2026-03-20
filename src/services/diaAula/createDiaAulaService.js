import AbstractService from '../abstractService.js';
import DiaAulaRepository from '../../repositories/diaAulaRepository.js';

export class CreateDiaAulaService extends AbstractService {
  constructor(Repository, data) {
    super(Repository);
    this.data = data;
  }

  async execute() {
    return await this.repository.create(
      {
        idAluno: this.data.idAluno,
        idContrato: this.data.idContrato,
        diaSemana: this.data.diaSemana,
        quantidadeAulas: this.data.quantidadeAulas,
        duracaoAula: this.data.duracaoAula,
        horaInicial: this.data.horaInicial,
        horaFinal: this.data.horaFinal
      },
      {
        select: this.repository.selectFields
      }
    );
  }

  static async handle(data) {
    const Repository = DiaAulaRepository;
    const service = new CreateDiaAulaService(Repository, data);
    return await service.execute();
  }
}
