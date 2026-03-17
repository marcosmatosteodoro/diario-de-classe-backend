import AbstractService from '../abstractService.js';
import UserRepository from '../../repositories/userRepository.js';

export class CreateUserService extends AbstractService {
  constructor(Repository, data) {
    super(Repository);
    this.data = data;
  }

  async execute() {
    return await this.repository.create(
      {
        nome: this.data.nome,
        sobrenome: this.data.sobrenome,
        email: this.data.email,
        telefone: this.data.telefone,
        senha: this.data.senha,
        resetarSenha: this.data.resetarSenha,
        permissao: this.data.permissao,
        idiomas: this.data.idiomas
      },
      {
        select: this.repository.selectFields
      }
    );
  }

  static async handle(data) {
    const Repository = UserRepository;
    const service = new CreateUserService(Repository, data);
    return await service.execute();
  }
}
