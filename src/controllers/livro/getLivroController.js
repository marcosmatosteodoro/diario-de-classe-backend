import AbstractController from '../abstractController.js';
import { GetLivroService } from '../../services/livro/getLivroService.js';

export class GetLivroController extends AbstractController {
  constructor(req, res) {
    super(req, res);
  }

  async execute() {
    try {
      const id = this.req.validatedId || this.req.params.id;
      const livro = await GetLivroService.handle(id, { withConteudos: true });

      if (!livro) {
        return this.res.status(404).json({
          message: this.req.t('livros.get.not_found')
        });
      }

      if (!this.req.user.isAdmin && !livro.ativo) {
        return this.res.status(404).json({
          message: this.req.t('livros.get.not_found')
        });
      }

      return this.res.status(200).json(livro);
    } catch (error) {
      return this.handleError(error, 'livros.get.error');
    }
  }

  static async handle(req, res) {
    const controller = new GetLivroController(req, res);
    await controller.execute();
  }
}
