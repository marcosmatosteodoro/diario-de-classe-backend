import AbstractService from '../abstractService.js';
import AulaRepository from '../../repositories/aulaRepository.js';

export class CreateAulaService extends AbstractService {
  constructor(Repository, data) {
    super(Repository);
    this.data = data;
  }

  async execute() {
    return await this.repository.create(
      {
        idAluno: this.data.idAluno,
        idProfessor: this.data.idProfessor,
        idContrato: this.data.idContrato,
        dataAula: this.data.dataAula,
        horaInicial: this.data.horaInicial,
        horaFinal: this.data.horaFinal,
        tipo: this.data.tipo,
        status: this.data.status,
        observacao: this.data.observacao
      },
      {
        select: this.repository.selectFields
      }
    );
  }

  static async handle(data) {
    const Repository = AulaRepository;
    const service = new CreateAulaService(Repository, data);
    return await service.execute();
  }
}
