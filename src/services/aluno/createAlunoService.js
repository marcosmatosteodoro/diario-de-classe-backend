import AbstractService from '../abstractService.js';
import AlunoRepository from '../../repositories/alunoRepository.js';

export class CreateAlunoService extends AbstractService {
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
        criador: this.data.criador,
        material: this.data.material
      },
      {
        select: this.repository.selectFields
      }
    );
  }

  static async handle(data) {
    const Repository = AlunoRepository;
    const service = new CreateAlunoService(Repository, data);
    return await service.execute();
  }
}
