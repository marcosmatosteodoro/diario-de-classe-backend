import AbstractService from '../abstractService.js';
import UserRepository from '../../repositories/userRepository.js';
import { getNomeCompleto } from '../../utilities/getNomeCompleto.js';
import { hashSenha } from '../../utilities/password.js';

export class CreateUserService extends AbstractService {
  constructor(Repository, data) {
    super(Repository);
    this.data = data;
  }

  async execute() {
    const senha =
      typeof this.data.senha === 'string' && this.data.senha !== ''
        ? await hashSenha(this.data.senha)
        : this.data.senha;

    return await this.repository.create(
      {
        nome: this.data.nome,
        sobrenome: this.data.sobrenome,
        nomeCompleto: getNomeCompleto(this.data),
        email: this.data.email,
        telefone: this.data.telefone,
        senha,
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
