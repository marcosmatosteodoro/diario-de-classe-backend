import AbstractController from '../abstractController.js';
import { GetLivroService } from '../../services/livro/getLivroService.js';
import { DeleteLivroService } from '../../services/livro/deleteLivroService.js';
import { GetCronogramaListByLivroService } from '../../services/cronograma/getCronogramaListByLivroService.js';

export class DeleteLivroController extends AbstractController {
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

      // Livro em uso nao pode ser apagado: apagaria o cronograma dos alunos que
      // estao cursando. A FK do cronograma e RESTRICT, mas conferir aqui devolve
      // um erro claro em vez de um 500 do banco. Para tirar de circulacao,
      // usa-se `ativo: false`.
      const cronogramas = await GetCronogramaListByLivroService.handle(id);

      if (cronogramas && cronogramas.length > 0) {
        return this.res.status(409).json({
          message: this.req.t('livros.delete.em_uso', { count: cronogramas.length })
        });
      }

      await DeleteLivroService.handle(id);

      return this.res.status(204).json();
    } catch (error) {
      return this.handleError(error, 'livros.delete.error');
    }
  }

  static async handle(req, res) {
    const controller = new DeleteLivroController(req, res);
    await controller.execute();
  }
}
