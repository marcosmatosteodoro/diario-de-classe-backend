import AbstractController from '../abstractController.js';
import { GetConteudoLivroService } from '../../services/conteudoLivro/getConteudoLivroService.js';
import { UpdateConteudoLivroService } from '../../services/conteudoLivro/updateConteudoLivroService.js';
import { ResequenciarCronogramasDoLivroService } from '../../services/cronograma/resequenciarCronogramasDoLivroService.js';
import { IsConteudoOrdemExistsService } from '../../services/conteudoLivro/isConteudoOrdemExistsService.js';

export class UpdateConteudoLivroController extends AbstractController {
  constructor(req, res) {
    super(req, res);
  }

  async execute() {
    try {
      const id = this.req.validatedId || this.req.params.id;
      const conteudo = await GetConteudoLivroService.handle(id);

      if (!conteudo) {
        return this.res.status(404).json({
          message: this.req.t('conteudosLivro.get.not_found')
        });
      }

      const { ordem } = this.req.validatedData;

      // Ordem informada precisa estar livre: o indice unico [idLivro, ordem]
      // estouraria como 500 em vez de erro de validacao.
      if (ordem !== undefined && ordem !== null && Number(ordem) !== conteudo.ordem) {
        const ocupada = await IsConteudoOrdemExistsService.handle({
          idLivro: conteudo.idLivro,
          ordem: Number(ordem),
          idIgnorado: id
        });

        if (ocupada) {
          return this.res.status(422).json({
            message: this.req.t('conteudosLivro.create.ordem_ocupada', { ordem })
          });
        }
      }

      const conteudoAtualizado = await UpdateConteudoLivroService.handle(
        id,
        this.req.validatedData
      );

      // Mudar a ordem muda a sequencia do livro: religa os cronogramas em curso.
      await ResequenciarCronogramasDoLivroService.handle(conteudo.idLivro);

      return this.res.status(200).json(conteudoAtualizado);
    } catch (error) {
      return this.handleError(error, 'conteudosLivro.update.error');
    }
  }

  static async handle(req, res) {
    const controller = new UpdateConteudoLivroController(req, res);
    await controller.execute();
  }
}
