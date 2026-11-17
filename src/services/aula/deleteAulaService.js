import AbstractService from '../abstractService.js';
import AulaRepository from '../../repositories/aulaRepository.js';

export class DeleteAulaService extends AbstractService {
  constructor(Repository, id) {
    super(Repository);
    this.id = id;
  }

  async execute() {
    return await this.repository.delete({ id: this.id });
  }

  /**
   * Hard delete: nao ha soft delete de aula em lugar nenhum do dominio. Quem
   * chamar isto perde o registro historico da aula, inclusive se ja `CONCLUIDA`.
   * @param {string} id
   * @returns {Promise<Object>} aula removida (registro completo do model, sem `select`)
   */
  static async handle(id) {
    const Repository = AulaRepository;
    const service = new DeleteAulaService(Repository, id);
    return await service.execute();
  }
}
