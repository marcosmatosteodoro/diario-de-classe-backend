import AbstractService from '../abstractService.js';
import UserRepository from '../../repositories/userRepository.js';

export class GetUserListService extends AbstractService {
  constructor(Repository = UserRepository) {
    super(Repository);
  }

  async execute() {
    const users = await this.repository.selectMany({
      select: {
        id: true,
        nome: true,
        sobrenome: true,
        email: true,
        telefone: true,
        resetarSenha: true,
        permissao: true,
        dataCriacao: true,
        dataAtualizacao: true
      }
    });

    return users;
  }

  static async handle(Repository = UserRepository) {
    const service = new GetUserListService(Repository);
    return await service.execute();
  }
}
