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

  /**
   * Hard delete direto; a FK de `CronogramaAluno` para `Livro` é `Restrict`, então
   * o banco recusa apagar livro com histórico — quem chama isto deve checar
   * antes (o controller já faz essa checagem com 409, em defesa em profundidade).
   * @param {string} id
   * @returns {Promise<Object>} livro removido
   */
  static async handle(id) {
    const Repository = LivroRepository;
    const service = new DeleteLivroService(Repository, id);
    return await service.execute();
  }
}
