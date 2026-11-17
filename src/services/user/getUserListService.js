import AbstractService from '../abstractService.js';
import UserRepository from '../../repositories/userRepository.js';

export class GetUserListService extends AbstractService {
  constructor(Repository, where) {
    super(Repository);
    this.where = where;
  }

  /**
   * @returns {Promise<Array<Object>>} usuários filtrados por `this.where`,
   *   ordenados por `nome`, projetados pela whitelist de saída (`senha` fora)
   */
  async execute() {
    return await this.repository.selectMany({
      select: this.repository.selectFields,
      where: this.where,
      orderBy: { nome: 'asc' }
    });
  }

  /**
   * @param {Object} [where] filtro Prisma (`{}` lista todos)
   * @returns {Promise<Array<Object>>} ver `execute()`
   */
  static async handle(where = {}) {
    const Repository = UserRepository;
    const service = new GetUserListService(Repository, where);
    return await service.execute();
  }
}
