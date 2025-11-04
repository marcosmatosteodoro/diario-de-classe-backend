import AbstractService from '../abstractService.js';
import UserRepository from '../../repositories/userRepository.js';

export class GetUserListService extends AbstractService {
  constructor(Repository) {
    super(Repository);
  }

  async execute() {
    return await this.repository.selectMany({
      select: this.repository.selectFields
    });
  }

  static async handle(Repository = UserRepository) {
    const service = new GetUserListService(Repository);
    return await service.execute();
  }
}
