import AbstractService from '../abstractService.js';
import DiaAulaRepository from '../../repositories/diaAulaRepository.js';

export class DeleteDiaAulaService extends AbstractService {
  constructor(Repository, id) {
    super(Repository);
    this.id = id;
  }

  async execute() {
    return await this.repository.delete({ id: this.id });
  }

  /**
   * Hard delete: sem soft delete de dia de aula.
   * @param {string} id
   * @returns {Promise<Object>} dia de aula removido (registro completo do model, sem `select`)
   */
  static async handle(id) {
    const Repository = DiaAulaRepository;
    const service = new DeleteDiaAulaService(Repository, id);
    return await service.execute();
  }
}
