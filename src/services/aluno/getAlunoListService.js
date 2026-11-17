import AbstractService from '../abstractService.js';
import AlunoRepository from '../../repositories/alunoRepository.js';

export class GetAlunoListService extends AbstractService {
  constructor(Repository, where) {
    super(Repository);
    this.where = where;
  }

  async execute() {
    return await this.repository.selectMany({
      select: this.repository.selectFields,
      where: this.where,
      orderBy: { nome: 'asc' }
    });
  }

  /**
   * @param {Object} [where] filtro Prisma livre
   * @returns {Promise<Array<Object>>} alunos ordenados por `nome` asc, projetados pela
   *   whitelist padrao
   */
  static async handle(where = {}) {
    const Repository = AlunoRepository;
    const service = new GetAlunoListService(Repository, where);
    return await service.execute();
  }
}
