import AbstractService from '../abstractService.js';
import ConteudoLivroRepository from '../../repositories/conteudoLivroRepository.js';

/**
 * Verifica se a ordem ja esta ocupada no livro, respeitando o indice unico
 * [idLivro, ordem]. Sem esta guarda o Prisma estourava P2002 e o handleError
 * devolvia 500 no lugar de um 422 explicando a colisao -- o livro ja tinha a
 * guarda equivalente (IsLivroNomeIdiomaExistsService) e o conteudo ficou sem.
 */
export class IsConteudoOrdemExistsService extends AbstractService {
  constructor(Repository, { idLivro, ordem, idIgnorado }) {
    super(Repository);
    this.where = { idLivro, ordem };

    if (idIgnorado) {
      this.where.id = { not: idIgnorado };
    }
  }

  async execute() {
    const conteudo = await this.repository.selectOne({
      where: this.where,
      select: { id: true }
    });

    return Boolean(conteudo);
  }

  static async handle({ idLivro, ordem, idIgnorado = null }) {
    const Repository = ConteudoLivroRepository;
    const service = new IsConteudoOrdemExistsService(Repository, {
      idLivro,
      ordem,
      idIgnorado
    });
    return await service.execute();
  }
}
