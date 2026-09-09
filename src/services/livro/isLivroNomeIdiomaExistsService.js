import AbstractService from '../abstractService.js';
import LivroRepository from '../../repositories/livroRepository.js';

/**
 * Verifica se ja existe livro com o mesmo nome no mesmo idioma, respeitando o
 * indice unico [nome, idioma]. Evita que o Prisma estoure P2002 como erro 500.
 */
export class IsLivroNomeIdiomaExistsService extends AbstractService {
  constructor(Repository, { nome, idioma, idIgnorado }) {
    super(Repository);
    this.nome = nome;
    this.idioma = idioma;
    this.idIgnorado = idIgnorado;
  }

  async execute() {
    const where = { nome: this.nome, idioma: this.idioma };

    if (this.idIgnorado) {
      where.id = { not: this.idIgnorado };
    }

    const livro = await this.repository.selectOne({ where, select: { id: true } });

    return Boolean(livro);
  }

  static async handle({ nome, idioma, idIgnorado = null }) {
    const Repository = LivroRepository;
    const service = new IsLivroNomeIdiomaExistsService(Repository, { nome, idioma, idIgnorado });
    return await service.execute();
  }
}
