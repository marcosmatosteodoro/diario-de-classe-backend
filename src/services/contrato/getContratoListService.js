import AbstractService from '../abstractService.js';
import ContratoRepository from '../../repositories/contratoRepository.js';

export class GetContratoListService extends AbstractService {
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
   * @param {Object} [where] filtro Prisma livre
   * @returns {Promise<Array<Object>>} contratos projetados pela whitelist padrao
   *   (inclui nome/nomeCompleto do aluno, sem lista de aulas)
   */
  static async handle(where = {}) {
    const Repository = ContratoRepository;
    const service = new GetContratoListService(Repository, where);
    return await service.execute();
  }
}
