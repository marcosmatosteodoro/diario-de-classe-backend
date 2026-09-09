import AbstractController from '../abstractController.js';
import { GetConteudoLivroService } from '../../services/conteudoLivro/getConteudoLivroService.js';
import { DeleteConteudoLivroService } from '../../services/conteudoLivro/deleteConteudoLivroService.js';
import { ResequenciarCronogramasDoLivroService } from '../../services/cronograma/resequenciarCronogramasDoLivroService.js';
import { GetAulasCongeladasPorConteudosService } from '../../services/aula/getAulasCongeladasPorConteudosService.js';

export class DeleteConteudoLivroController extends AbstractController {
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

      // Apagar o conteudo zera o vinculo das aulas via ON DELETE SET NULL. Se
      // alguma aula concluida aponta para ele, o registro do que foi dado se
      // perderia sem volta -- entao a exclusao e recusada.
      const comHistorico = await GetAulasCongeladasPorConteudosService.handle([id]);

      if (comHistorico && comHistorico.length > 0) {
        return this.res.status(409).json({
          message: this.req.t('conteudosLivro.delete.tem_historico', {
            count: comHistorico.length
          })
        });
      }

      await DeleteConteudoLivroService.handle(id);

      // As aulas que apontavam para este conteudo ficaram com idConteudo nulo
      // (FK ON DELETE SET NULL); o resequenciamento reencaixa a sequencia.
      await ResequenciarCronogramasDoLivroService.handle(conteudo.idLivro);

      return this.res.status(204).json();
    } catch (error) {
      return this.handleError(error, 'conteudosLivro.delete.error');
    }
  }

  static async handle(req, res) {
    const controller = new DeleteConteudoLivroController(req, res);
    await controller.execute();
  }
}
