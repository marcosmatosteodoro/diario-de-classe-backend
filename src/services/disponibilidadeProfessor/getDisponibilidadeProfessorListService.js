import AbstractService from '../abstractService.js';
import DisponibilidadeProfessorRepository from '../../repositories/disponibilidadeProfessorRepository.js';

export class GetDisponibilidadeProfessorListService extends AbstractService {
  constructor(Repository, where) {
    super(Repository);
    this.where = where;
  }

  async execute() {
    return await this.repository.selectMany({
      select: this.repository.selectFields,
      where: this.where
    });
  }

  /**
   * @param {Object} [where] filtro Prisma livre (ex.: `{ userId }`)
   * @returns {Promise<Array<Object>>} disponibilidades projetadas pela whitelist padrao
   */
  static async handle(where = {}) {
    const Repository = DisponibilidadeProfessorRepository;
    const service = new GetDisponibilidadeProfessorListService(Repository, where);
    return await service.execute();
  }
}
