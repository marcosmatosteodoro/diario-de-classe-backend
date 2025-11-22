import AbstractService from '../abstractService.js';
import DiaDeFuncionamentoRepository from '../../repositories/diaDeFuncionamentoRepository.js';

export class CreateDiaDeFuncionamentoService extends AbstractService {
  constructor(Repository, data) {
    super(Repository);
    this.data = data;
  }

  async execute() {
    return await this.repository.create(
      {
        diaSemana: this.data.diaSemana,
        horaInicial: this.data.horaInicial,
        horaFinal: this.data.horaFinal,
        ativo: this.data.ativo,
        configuracaoId: this.data.configuracaoId
      },
      {
        select: this.repository.selectFields
      }
    );
  }

  static async handle(data) {
    const Repository = DiaDeFuncionamentoRepository;
    const service = new CreateDiaDeFuncionamentoService(Repository, data);
    return await service.execute();
  }
}
