import AbstractController from '../abstractController.js';
import { GetLivroService } from '../../services/livro/getLivroService.js';
import { GetConteudoLivroListService } from '../../services/conteudoLivro/getConteudoLivroListService.js';

export class GetConteudoLivroListByLivroController extends AbstractController {
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

      const conteudos = await GetConteudoLivroListService.handle({ idLivro });

      if (!conteudos || conteudos.length === 0) {
        return this.res.status(204).json();
      }

      return this.res.status(200).json({
        count: conteudos.length,
        data: conteudos
      });
    } catch (error) {
      return this.handleError(error, 'conteudosLivro.list.error');
    }
  }

  static async handle(req, res) {
    const controller = new GetConteudoLivroListByLivroController(req, res);
    await controller.execute();
  }
}
