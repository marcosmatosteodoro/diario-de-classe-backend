import AbstractService from '../abstractService.js';
import DiaAulaRepository from '../../repositories/diaAulaRepository.js';

export class GetDiaAulaService extends AbstractService {
  constructor(Repository, id, additionalWhere) {
    super(Repository);
    this.where = { id, ...additionalWhere };
  }

  async execute() {
    return await this.repository.selectOne({
      where: this.where,
      select: this.repository.selectFields
    });
  }

  /**
   * @param {string} id
   * @param {Object} [additionalWhere] filtro extra mesclado ao `where` (ex.: autorizacao)
   * @returns {Promise<Object|null>} dia de aula projetado pela whitelist de saida, ou `null`
   */
  static async handle(id, additionalWhere = {}) {
    const Repository = DiaAulaRepository;
    const service = new GetDiaAulaService(Repository, id, additionalWhere);
    return await service.execute();
  }
}
