import AbstractController from '../abstractController.js';
import { GetLivroService } from '../../services/livro/getLivroService.js';
import { UpdateLivroService } from '../../services/livro/updateLivroService.js';
import { IsLivroNomeIdiomaExistsService } from '../../services/livro/isLivroNomeIdiomaExistsService.js';

export class UpdateLivroController extends AbstractController {
  constructor(req, res) {
    super(req, res);
  }

  async execute() {
    try {
      const id = this.req.validatedId || this.req.params.id;
      const livro = await GetLivroService.handle(id);

      if (!livro) {
        return this.res.status(404).json({
          message: this.req.t('livros.get.not_found')
        });
      }

      const data = this.req.validatedData;
      const nome = data.nome ?? livro.nome;
      const idioma = data.idioma ?? livro.idioma;

      const jaExiste = await IsLivroNomeIdiomaExistsService.handle({
        nome,
        idioma,
        idIgnorado: id
      });

      if (jaExiste) {
        return this.res.status(422).json({
          message: this.req.t('livros.create.nome_idioma_exists')
        });
      }

      const livroAtualizado = await UpdateLivroService.handle(id, data);

      return this.res.status(200).json(livroAtualizado);
    } catch (error) {
      return this.handleError(error, 'livros.update.error');
    }
  }

  static async handle(req, res) {
    const controller = new UpdateLivroController(req, res);
    await controller.execute();
  }
}
