import AbstractService from '../abstractService.js';
import LivroRepository from '../../repositories/livroRepository.js';
import { toInteiroOuNulo } from '../../utilities/toInteiro.js';

export class UpdateLivroService extends AbstractService {
  constructor(Repository, id, data) {
    super(Repository);
    this.id = id;
    this.data = data;
  }

  async execute() {
    const data = {
      nome: this.data.nome,
      idioma: this.data.idioma,
      nivel: this.data.nivel === undefined ? undefined : toInteiroOuNulo(this.data.nivel),
      ativo: this.data.ativo
    };

    // remover campos undefined
    Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);

    return await this.repository.update({ id: this.id }, data, {
      select: this.repository.selectFields
    });
  }

  /**
   * Update genérico de livro. Não há checagem aqui (nem no controller) que impeça
   * trocar `idioma` de um livro já em uso por cronograma — a coerência livro↔contrato
   * só é validada na criação do cronograma, nunca depois.
   *
   * @param {string} id
   * @param {Object} data campos parciais (chaves `undefined` são removidas antes do update)
   * @returns {Promise<Object>} livro atualizado, projetado pela whitelist padrao
   */
  static async handle(id, data) {
    const Repository = LivroRepository;
    const service = new UpdateLivroService(Repository, id, data);
    return await service.execute();
  }
}
