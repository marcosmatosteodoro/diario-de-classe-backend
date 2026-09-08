import AbstractService from '../abstractService.js';
import LivroRepository from '../../repositories/livroRepository.js';

export class GetLivroService extends AbstractService {
  constructor(Repository, id, { withConteudos = false } = {}) {
    super(Repository);
    this.where = { id };
    this.withConteudos = withConteudos;
  }

  async execute() {
    return await this.repository.selectOne({
      where: this.where,
      select: this.withConteudos
        ? this.repository.getSelectFieldsWithConteudos()
        : this.repository.selectFields
    });
  }

  static async handle(id, options = {}) {
    const Repository = LivroRepository;
    const service = new GetLivroService(Repository, id, options);
    return await service.execute();
  }
}
