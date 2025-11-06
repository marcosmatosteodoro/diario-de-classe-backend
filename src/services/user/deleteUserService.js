import AbstractService from '../abstractService.js';
import UserRepository from '../../repositories/userRepository.js';

export class DeleteUserService extends AbstractService {
  constructor(Repository, id) {
    super(Repository);
    this.id = id;
  }

  async execute() {
    return await this.repository.delete({ id: this.id });
  }

  static async handle(id) {
    const Repository = UserRepository;
    const service = new DeleteUserService(Repository, id);
    return await service.execute();
  }
}
