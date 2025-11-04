import AbstractService from '../abstractService.js';
import UserRepository from '../../repositories/userRepository.js';

export class GetUserService extends AbstractService {
  constructor(Repository = UserRepository, id) {
    super(Repository);
    this.id = id;
  }

  async execute() {
    return await this.repository.selectOne({
      where: { id: this.id },
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
  }

  static async handle(Repository = UserRepository, id) {
    const service = new GetUserService(Repository, id);
    return await service.execute();
  }
}
