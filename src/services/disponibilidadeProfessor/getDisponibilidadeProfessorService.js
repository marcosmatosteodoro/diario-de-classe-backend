import AbstractService from '../abstractService.js';
import DisponibilidadeProfessorRepository from '../../repositories/disponibilidadeProfessorRepository.js';

export class GetDisponibilidadeProfessorService extends AbstractService {
  constructor(Repository, id) {
    super(Repository);
    this.id = id;
  }

  async execute() {
    return await this.repository.selectOne({
      where: { id: this.id },
      select: this.repository.selectFields
    });
  }

  /**
   * Versão singular — sem rota nem controller que a chame hoje; quem roda é
   * `GetDisponibilidadeProfessorListService`.
   * @param {string} id
   * @returns {Promise<Object|null>} disponibilidade projetada pela whitelist padrao, ou `null`
   */
  static async handle(id) {
    const Repository = DisponibilidadeProfessorRepository;
    const service = new GetDisponibilidadeProfessorService(Repository, id);
    return await service.execute();
  }
}
