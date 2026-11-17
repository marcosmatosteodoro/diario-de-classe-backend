import AbstractService from '../abstractService.js';
import CronogramaAlunoRepository from '../../repositories/cronogramaAlunoRepository.js';

export class GetCronogramaService extends AbstractService {
  constructor(Repository, id, additionalWhere) {
    super(Repository);
    this.where = { id, ...additionalWhere };
  }

  async execute() {
    return await this.repository.selectOne({
      where: this.where,
      select: this.repository.getSelectFieldsWithLivro()
    });
  }

  /**
   * @param {string} id
   * @param {Object} [additionalWhere] filtro extra de autorizacao
   * @returns {Promise<Object|null>} cronograma com livro projetado, ou `null`
   */
  static async handle(id, additionalWhere = {}) {
    const Repository = CronogramaAlunoRepository;
    const service = new GetCronogramaService(Repository, id, additionalWhere);
    return await service.execute();
  }
}
