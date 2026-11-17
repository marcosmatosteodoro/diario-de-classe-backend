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

  /**
   * Hard delete direto. A FK de `Aula` para este conteudo e `SetNull`: apagar um
   * conteudo com aula historica zera o vinculo em silencio — quem chama isto
   * deve checar antes com `GetAulasCongeladasPorConteudosService` (o controller
   * ja faz essa checagem com 409).
   * @param {string} id
   * @returns {Promise<Object>} conteudo removido
   */
  static async handle(id) {
    const Repository = ConteudoLivroRepository;
    const service = new DeleteConteudoLivroService(Repository, id);
    return await service.execute();
  }
}
