import AbstractController from '../abstractController.js';
import { GetLivroService } from '../../services/livro/getLivroService.js';
import { CreateConteudoLivroService } from '../../services/conteudoLivro/createConteudoLivroService.js';
import { ResequenciarCronogramasDoLivroService } from '../../services/cronograma/resequenciarCronogramasDoLivroService.js';
import { IsConteudoOrdemExistsService } from '../../services/conteudoLivro/isConteudoOrdemExistsService.js';

export class CreateConteudoLivroController extends AbstractController {
  constructor(req, res) {
    super(req, res);
  }

  async execute() {
    try {
      const idLivro = this.req.validatedId || this.req.params.id;
      const livro = await GetLivroService.handle(idLivro);

      if (!livro) {
        return this.res.status(404).json({
          message: this.req.t('livros.get.not_found')
        });
      }

      const { ordem } = this.req.validatedData;

      // Ordem informada precisa estar livre: o indice unico [idLivro, ordem]
      // estouraria como 500 em vez de erro de validacao.
      if (ordem !== undefined && ordem !== null) {
        const ocupada = await IsConteudoOrdemExistsService.handle({
          idLivro,
          ordem: Number(ordem)
        });

        if (ocupada) {
          return this.res.status(422).json({
            message: this.req.t('conteudosLivro.create.ordem_ocupada', { ordem })
          });
        }
      }

      const conteudo = await CreateConteudoLivroService.handle({
        ...this.req.validatedData,
        idLivro
      });

      // A sequencia do livro mudou: religa os cronogramas em curso.
      await ResequenciarCronogramasDoLivroService.handle(idLivro);

      return this.res.status(201).json(conteudo);
    } catch (error) {
      return this.handleError(error, 'conteudosLivro.create.error');
    }
  }

  static async handle(req, res) {
    const controller = new CreateConteudoLivroController(req, res);
    await controller.execute();
  }
}
