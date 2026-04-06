import AbstractService from '../abstractService.js';
import UserRepository from '../../repositories/userRepository.js';
import { getNomeCompleto } from '../../utilities/getNomeCompleto.js';

export class UpdateUserService extends AbstractService {
  constructor(Repository, id, data) {
    super(Repository);
    this.id = id;
    this.data = data;
  }

  async execute() {
    const data = {
      nome: this.data.nome,
      sobrenome: this.data.sobrenome,
      nomeCompleto: getNomeCompleto(this.data),
      email: this.data.email,
      telefone: this.data.telefone,
      senha: this.data.senha,
      resetarSenha: this.data.resetarSenha,
      permissao: this.data.permissao,
      idiomas: this.data.idiomas
    };

    // remover campos undefined
    Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);

    return await this.repository.update({ id: this.id }, data, {
      select: this.repository.selectFields
    });
  }

  static async handle(id, data) {
    const Repository = UserRepository;
    const service = new UpdateUserService(Repository, id, data);
    return await service.execute();
  }
}
