import AbstractController from '../abstractController.js';
import { CreateLivroService } from '../../services/livro/createLivroService.js';
import { IsLivroNomeIdiomaExistsService } from '../../services/livro/isLivroNomeIdiomaExistsService.js';

export class CreateLivroController extends AbstractController {
  constructor(req, res) {
    super(req, res);
  }

  async execute() {
    try {
      const data = this.req.validatedData;

      const jaExiste = await IsLivroNomeIdiomaExistsService.handle({
        nome: data.nome,
        idioma: data.idioma
      });

      if (jaExiste) {
        return this.res.status(422).json({
          message: this.req.t('livros.create.nome_idioma_exists')
        });
      }

      const livro = await CreateLivroService.handle(data);

      return this.res.status(201).json(livro);
    } catch (error) {
      return this.handleError(error, 'livros.create.error');
    }
  }

  static async handle(req, res) {
    const controller = new CreateLivroController(req, res);
    await controller.execute();
  }
}
