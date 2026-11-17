import AbstractService from '../abstractService.js';
import UserRepository from '../../repositories/userRepository.js';

export class IsUserEmailExistsService extends AbstractService {
  constructor(Repository, email) {
    super(Repository);
    this.email = email;
  }

  /**
   * @returns {Promise<boolean>} `true` se existir usuário com `this.email`
   */
  async execute() {
    const user = await this.repository.selectOne({
      where: { email: this.email },
      select: { id: true }
    });

    return Boolean(user);
  }

  /**
   * @param {string} email
   * @returns {Promise<boolean>} ver `execute()`
   */
  static async handle(email) {
    const Repository = UserRepository;
    const service = new IsUserEmailExistsService(Repository, email);
    return await service.execute();
  }
}
