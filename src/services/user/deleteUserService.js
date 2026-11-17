import AbstractService from '../abstractService.js';
import UserRepository from '../../repositories/userRepository.js';

export class DeleteUserService extends AbstractService {
  constructor(Repository, id) {
    super(Repository);
    this.id = id;
  }

  /**
   * Exclui o usuário (`repository.delete`, sem `select`).
   * @returns {Promise<Object>} usuário removido; `DeleteUserController`
   *   descarta o retorno e responde 204
   */
  async execute() {
    return await this.repository.delete({ id: this.id });
  }

  /**
   * @param {string} id
   * @returns {Promise<Object>} ver `execute()`
   */
  static async handle(id) {
    const Repository = UserRepository;
    const service = new DeleteUserService(Repository, id);
    return await service.execute();
  }
}
