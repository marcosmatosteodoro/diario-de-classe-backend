import AbstractService from '../abstractService.js';
import DiaDeFuncionamentoRepository from '../../repositories/diaDeFuncionamentoRepository.js';

export class UpdateDiaDeFuncionamentoService extends AbstractService {
  constructor(Repository, id, data) {
    super(Repository);
    this.id = id;
    this.data = data;
  }

  async execute() {
    const data = {
      diaSemana: this.data.diaSemana,
      horaInicial: this.data.horaInicial,
      horaFinal: this.data.horaFinal,
      ativo: this.data.ativo,
      configuracaoId: this.data.configuracaoId
    };

    // remover campos undefined
    Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);

    return await this.repository.update({ id: this.id }, data, {
      select: this.repository.selectFields
    });
  }

  static async handle(id, data) {
    const Repository = DiaDeFuncionamentoRepository;
    const service = new UpdateDiaDeFuncionamentoService(Repository, id, data);
    return await service.execute();
  }
}
