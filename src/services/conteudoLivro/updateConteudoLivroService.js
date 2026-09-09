import AbstractService from '../abstractService.js';
import ConteudoLivroRepository from '../../repositories/conteudoLivroRepository.js';
import { toInteiroOuNulo } from '../../utilities/toInteiro.js';

export class UpdateConteudoLivroService extends AbstractService {
  constructor(Repository, id, data) {
    super(Repository);
    this.id = id;
    this.data = data;
  }

  async execute() {
    const data = {
      ordem: this.data.ordem === undefined ? undefined : toInteiroOuNulo(this.data.ordem),
      titulo: this.data.titulo,
      descricao: this.data.descricao
    };

    // remover campos undefined
    Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);

    return await this.repository.update({ id: this.id }, data, {
      select: this.repository.selectFields
    });
  }

  static async handle(id, data) {
    const Repository = ConteudoLivroRepository;
    const service = new UpdateConteudoLivroService(Repository, id, data);
    return await service.execute();
  }
}
