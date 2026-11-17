import AbstractService from '../abstractService.js';
import DiaAulaRepository from '../../repositories/diaAulaRepository.js';

export class GetDiaAulaListService extends AbstractService {
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
   * @param {Object} [where] filtro Prisma livre (ex.: idContrato, idAluno)
   * @returns {Promise<Array<Object>>} dias de aula projetados pela whitelist de saida,
   *   sem ordenacao explicita
   */
  static async handle(where = {}) {
    const Repository = DiaAulaRepository;
    const service = new GetDiaAulaListService(Repository, where);
    return await service.execute();
  }
}
