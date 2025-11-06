import AbstractService from '../abstractService.js';
import UserRepository from '../../repositories/userRepository.js';

export class GetUserListService extends AbstractService {
  constructor({ where, Repository }) {
    super(Repository);
    this.where = where;
  }

  async execute() {
    return await this.repository.selectMany({
      select: this.repository.selectFields,
      where: this.where
    });
  }

  static async handle(where = {}, Repository = UserRepository) {
    const service = new GetUserListService({ where, Repository });
    return await service.execute();
  }
}
