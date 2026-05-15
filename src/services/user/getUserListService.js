import AbstractService from '../abstractService.js';
import UserRepository from '../../repositories/userRepository.js';

export class GetUserListService extends AbstractService {
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

  static async handle(where = {}) {
    const Repository = UserRepository;
    const service = new GetUserListService(Repository, where);
    return await service.execute();
  }
}
