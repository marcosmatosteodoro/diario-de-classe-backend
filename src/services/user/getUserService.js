import AbstractService from '../abstractService.js';
import UserRepository from '../../repositories/userRepository.js';

export class GetUserService extends AbstractService {
  constructor(Repository, id) {
    super(Repository);
    this.id = id;
  }

  async execute() {
    return await this.repository.selectOne({
      where: { id: this.id },
      select: this.repository.selectFields
    });
  }

  static async handle(id) {
    const Repository = UserRepository;
    const service = new GetUserService(Repository, id);
    return await service.execute();
  }
}
