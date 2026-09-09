import AbstractService from '../abstractService.js';
import ConteudoLivroRepository from '../../repositories/conteudoLivroRepository.js';

/**
 * Substitui o conteudo de um livro pelo conteudo importado da planilha.
 *
 * A troca acontece por posicao (`ordem`): a linha que ja ocupa aquela ordem e
 * atualizada, e nao apagada e recriada (ver
 * ConteudoLivroRepository.substituirByLivro). Assim a FK das aulas nunca e
 * zerada e o vinculo das aulas ja concluidas sobrevive a reimportacao.
 *
 * Quem chama e responsavel por barrar a importacao quando a planilha menor
 * removeria conteudo com historico -- ver a guarda no controller de upload.
 */
export class SubstituirConteudosLivroService extends AbstractService {
  constructor(Repository, idLivro, conteudos) {
    super(Repository);
    this.idLivro = idLivro;
    this.conteudos = conteudos;
  }

  async execute() {
    const data = this.conteudos.map((conteudo, indice) => ({
      idLivro: this.idLivro,
      ordem: conteudo.ordem === undefined ? indice + 1 : conteudo.ordem,
      titulo: conteudo.titulo,
      descricao: conteudo.descricao || null
    }));

    return await this.repository.substituirByLivro(this.idLivro, data);
  }

  static async handle(idLivro, conteudos) {
    const Repository = ConteudoLivroRepository;
    const service = new SubstituirConteudosLivroService(Repository, idLivro, conteudos);
    return await service.execute();
  }
}
