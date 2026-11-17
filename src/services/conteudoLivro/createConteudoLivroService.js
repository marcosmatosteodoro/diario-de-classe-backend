import AbstractService from '../abstractService.js';
import ConteudoLivroRepository from '../../repositories/conteudoLivroRepository.js';
import { toInteiroOuNulo } from '../../utilities/toInteiro.js';

export class CreateConteudoLivroService extends AbstractService {
  constructor(Repository, data) {
    super(Repository);
    this.data = data;
  }

  async execute() {
    // Sem ordem informada, o conteudo entra no fim da sequencia do livro.
    const ordem =
      this.data.ordem === undefined || this.data.ordem === null
        ? (await this.repository.maxOrdemByLivro(this.data.idLivro)) + 1
        : toInteiroOuNulo(this.data.ordem);

    return await this.repository.create(
      {
        idLivro: this.data.idLivro,
        ordem,
        titulo: this.data.titulo,
        descricao: this.data.descricao
      },
      {
        select: this.repository.selectFields
      }
    );
  }

  /**
   * @param {Object} data
   * @param {string} data.idLivro
   * @param {number|string} [data.ordem] posicao do conteudo no livro; ausente/null
   *   encadeia no fim da sequencia atual
   * @param {string} data.titulo
   * @param {string} [data.descricao]
   * @returns {Promise<Object>} conteudo criado, projetado pela whitelist padrao
   */
  static async handle(data) {
    const Repository = ConteudoLivroRepository;
    const service = new CreateConteudoLivroService(Repository, data);
    return await service.execute();
  }
}
