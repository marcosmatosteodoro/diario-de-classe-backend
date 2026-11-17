import AbstractService from '../abstractService.js';
import ContratoRepository from '../../repositories/contratoRepository.js';

export class DeleteContratoService extends AbstractService {
  constructor(Repository, id) {
    super(Repository);
    this.id = id;
  }

  async execute() {
    return await this.repository.delete({ id: this.id });
  }

  /**
   * Hard delete direto, sem checar aulas dependentes: a cascata do schema
   * apaga todas as aulas do contrato junto, inclusive as `CONCLUIDA`.
   * @param {string} id
   * @returns {Promise<Object>} contrato removido
   */
  static async handle(id) {
    const Repository = ContratoRepository;
    const service = new DeleteContratoService(Repository, id);
    return await service.execute();
  }
}
