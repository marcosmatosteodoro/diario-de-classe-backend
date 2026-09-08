import AbstractService from '../abstractService.js';
import ConteudoLivroRepository from '../../repositories/conteudoLivroRepository.js';

export class DeleteConteudoLivroService extends AbstractService {
  constructor(Repository, id) {
    super(Repository);
    this.id = id;
  }

  async execute() {
    return await this.repository.delete({ id: this.id });
  }

  static async handle(id) {
    const Repository = ConteudoLivroRepository;
    const service = new DeleteConteudoLivroService(Repository, id);
    return await service.execute();
  }
}
