import { AbstractCronogramaController } from './AbstractCronogramaController.js';
import { GetCronogramaService } from '../../services/cronograma/getCronogramaService.js';
import { UpdateCronogramaService } from '../../services/cronograma/updateCronogramaService.js';
import { ResequenciarCronogramaService } from '../../services/cronograma/resequenciarCronogramaService.js';

export class UpdateCronogramaController extends AbstractCronogramaController {
  constructor(req, res) {
    super(req, res);
  }

  async execute() {
    try {
      const id = this.req.validatedId || this.req.params.id;
      const cronograma = await GetCronogramaService.handle(id, this.where);

      if (!cronograma) {
        return this.res.status(404).json({
          message: this.req.t('cronogramas.get.not_found')
        });
      }

      const cronogramaAtualizado = await UpdateCronogramaService.handle(
        id,
        this.req.validatedData,
        cronograma.idContrato
      );

      // Encerrar ou reabrir o livro muda qual cronograma esta ativo, e com isso
      // muda a sequencia que o contrato deve seguir.
      const resequenciamento = await ResequenciarCronogramaService.handle(cronograma.idContrato);

      return this.res.status(200).json({
        ...cronogramaAtualizado,
        resequenciamento
      });
    } catch (error) {
      return this.handleError(error, 'cronogramas.update.error');
    }
  }

  static async handle(req, res) {
    const controller = new UpdateCronogramaController(req, res);
    await controller.execute();
  }
}
