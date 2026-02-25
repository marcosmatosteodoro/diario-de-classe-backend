import { GetAulaService } from '../../services/aula/getAulaService.js';
import { DeleteAulaService } from '../../services/aula/deleteAulaService.js';
import { AbstractAulaController } from './AbstractAulaController.js';
import { UpdateAulasContratoService } from '../../services/contrato/updateAulasContratoService.js';

export class DeleteAulaController extends AbstractAulaController {
  constructor(req, res) {
    super(req, res);
  }

  async execute() {
    try {
      const id = this.req.validatedId || this.req.params.id;
      const aula = await GetAulaService.handle(id, this.where);

      if (!aula) {
        return this.res.status(404).json({
          message: this.req.t('aulas.get.not_found')
        });
      }

      await DeleteAulaService.handle(id);
      await UpdateAulasContratoService.handle(aula.idContrato);

      return this.res.status(204).json();
    } catch (error) {
      return this.handleError(error, 'aulas.delete.error');
    }
  }

  static async handle(req, res) {
    const controller = new DeleteAulaController(req, res);
    await controller.execute();
  }
}
