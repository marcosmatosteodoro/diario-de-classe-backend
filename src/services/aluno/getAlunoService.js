import AbstractService from '../abstractService.js';
import AlunoRepository from '../../repositories/alunoRepository.js';

export class GetAlunoService extends AbstractService {
  constructor(Repository, id, additionalWhere = {}) {
    super(Repository);
    this.where = {
      id: id,
      ...additionalWhere
    };
  }

  async execute() {
    return await this.repository.selectOne({
      where: this.where,
      select: this.repository.selectFields
    });
  }

  /**
   * @param {string} id
   * @param {Object} [additionalWhere] filtro extra mesclado ao `where` (filtro do controller)
   * @returns {Promise<Object|null>} aluno projetado pela whitelist padrao, ou `null`
   */
  static async handle(id, additionalWhere = {}) {
    const Repository = AlunoRepository;
    const service = new GetAlunoService(Repository, id, additionalWhere);
    return await service.execute();
  }
}
