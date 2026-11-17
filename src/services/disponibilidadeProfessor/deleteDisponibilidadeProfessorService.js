import AbstractService from '../abstractService.js';
import DisponibilidadeProfessorRepository from '../../repositories/disponibilidadeProfessorRepository.js';

export class DeleteDisponibilidadeProfessorService extends AbstractService {
  constructor(Repository, id) {
    super(Repository);
    this.id = id;
  }

  async execute() {
    return await this.repository.delete({ id: this.id });
  }

  /**
   * Sem rota nem controller que o chame hoje — código morto, só exercitado pelo
   * próprio teste unitário.
   * @param {string} id
   * @returns {Promise<Object>} disponibilidade removida
   */
  static async handle(id) {
    const Repository = DisponibilidadeProfessorRepository;
    const service = new DeleteDisponibilidadeProfessorService(Repository, id);
    return await service.execute();
  }
}
