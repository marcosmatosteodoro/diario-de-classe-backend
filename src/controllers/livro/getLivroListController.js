import AbstractController from '../abstractController.js';
import { GetLivroListService } from '../../services/livro/getLivroListService.js';

export class GetLivroListController extends AbstractController {
  constructor(req, res) {
    super(req, res);
  }

  async execute() {
    try {
      if (this.req.query.q) {
        this.getWhereClauseByQuerySearch({
          query: this.req.query.q,
          fields: ['nome']
        });
      }

      // Professor lista apenas os livros em uso; admin enxerga os inativos
      // tambem, para poder reativar ou corrigir o catalogo.
      if (!this.req.user.isAdmin) {
        this.where.ativo = true;
      }

      const livros = await GetLivroListService.handle(this.where);

      if (!livros || livros.length === 0) {
        return this.res.status(204).json();
      }

      return this.res.status(200).json({
        count: livros.length,
        data: livros
      });
    } catch (error) {
      return this.handleError(error, 'livros.list.error');
    }
  }

  static async handle(req, res) {
    const controller = new GetLivroListController(req, res);
    await controller.execute();
  }
}
