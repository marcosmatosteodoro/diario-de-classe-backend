import AbstractService from '../abstractService.js';
import LivroRepository from '../../repositories/livroRepository.js';
import { toInteiroOuNulo } from '../../utilities/toInteiro.js';

export class CreateLivroService extends AbstractService {
  constructor(Repository, data) {
    super(Repository);
    this.data = data;
  }

  async execute() {
    return await this.repository.create(
      {
        nome: this.data.nome,
        idioma: this.data.idioma,
        // ValidateData.isNumber() aceita string numerica ("3" passa) e o Prisma
        // recusa String em coluna Int, virando 500. A coercao mantem o tipo.
        nivel: toInteiroOuNulo(this.data.nivel),
        ativo: this.data.ativo
      },
      {
        select: this.repository.selectFields
      }
    );
  }

  static async handle(data) {
    const Repository = LivroRepository;
    const service = new CreateLivroService(Repository, data);
    return await service.execute();
  }
}
