import AbstractService from '../abstractService.js';
import LivroRepository from '../../repositories/livroRepository.js';

export class DeleteLivroService extends AbstractService {
  constructor(Repository, id) {
    super(Repository);
    this.id = id;
  }

  async execute() {
    return await this.repository.delete({ id: this.id });
  }

  static async handle(id) {
    const Repository = LivroRepository;
    const service = new DeleteLivroService(Repository, id);
    return await service.execute();
  }
}
