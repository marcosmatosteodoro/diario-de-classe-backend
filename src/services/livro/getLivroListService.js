import AbstractService from '../abstractService.js';
import LivroRepository from '../../repositories/livroRepository.js';

export class GetLivroListService extends AbstractService {
  constructor(Repository, where) {
    super(Repository);
    this.where = where;
  }

  async execute() {
    return await this.repository.selectMany({
      select: this.repository.selectFields,
      where: this.where,
      orderBy: [{ idioma: 'asc' }, { nivel: 'asc' }, { nome: 'asc' }]
    });
  }

  static async handle(where = {}) {
    const Repository = LivroRepository;
    const service = new GetLivroListService(Repository, where);
    return await service.execute();
  }
}
