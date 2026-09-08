import AbstractService from '../abstractService.js';
import ConteudoLivroRepository from '../../repositories/conteudoLivroRepository.js';

export class GetConteudoLivroListService extends AbstractService {
  constructor(Repository, where) {
    super(Repository);
    this.where = where;
  }

  async execute() {
    return await this.repository.selectMany({
      select: this.repository.selectFields,
      where: this.where,
      orderBy: { ordem: 'asc' }
    });
  }

  static async handle(where = {}) {
    const Repository = ConteudoLivroRepository;
    const service = new GetConteudoLivroListService(Repository, where);
    return await service.execute();
  }
}
