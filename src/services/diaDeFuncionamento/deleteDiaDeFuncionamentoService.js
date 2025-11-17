import AbstractService from '../abstractService.js';
import DiaDeFuncionamentoRepository from '../../repositories/diaDeFuncionamentoRepository.js';

export class DeleteDiaDeFuncionamentoService extends AbstractService {
  constructor(Repository, id) {
    super(Repository);
    this.id = id;
  }

  async execute() {
    return await this.repository.delete({ id: this.id });
  }

  static async handle(id) {
    const Repository = DiaDeFuncionamentoRepository;
    const service = new DeleteDiaDeFuncionamentoService(Repository, id);
    return await service.execute();
  }
}
