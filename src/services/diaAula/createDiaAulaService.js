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
        diaDaSemana: this.data.diaDaSemana,
        quantidadeDeAulas: this.data.quantidadeDeAulas,
        horaDeInicio: this.data.horaDeInicio,
        horaDeFim: this.data.horaDeFim
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
