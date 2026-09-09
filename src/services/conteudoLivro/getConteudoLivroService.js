import AbstractService from '../abstractService.js';
import ConteudoLivroRepository from '../../repositories/conteudoLivroRepository.js';

export class GetConteudoLivroService extends AbstractService {
  constructor(Repository, id, additionalWhere) {
    super(Repository);
    this.where = { id, ...additionalWhere };
  }

  async execute() {
    return await this.repository.selectOne({
      where: this.where,
      select: this.repository.selectFields
    });
  }

  static async handle(id, additionalWhere = {}) {
    const Repository = ConteudoLivroRepository;
    const service = new GetConteudoLivroService(Repository, id, additionalWhere);
    return await service.execute();
  }
}
