import AbstractService from '../abstractService.js';
import AlunoRepository from '../../repositories/alunoRepository.js';

export class UpdateAlunoService extends AbstractService {
  constructor(Repository, id, data) {
    super(Repository);
    this.id = id;
    this.data = data;
  }

  async execute() {
    const data = {
      nome: this.data.nome,
      sobrenome: this.data.sobrenome,
      email: this.data.email,
      telefone: this.data.telefone,
      criador: this.data.criador
    };

    // remover campos undefined
    Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);

    return await this.repository.update({ id: this.id }, data, {
      select: this.repository.selectFields
    });
  }

  static async handle(id, data) {
    const Repository = AlunoRepository;
    const service = new UpdateAlunoService(Repository, id, data);
    return await service.execute();
  }
}
