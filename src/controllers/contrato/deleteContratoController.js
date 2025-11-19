import AbstractController from '../abstractController.js';
import { GetContratoService } from '../../services/contrato/getContratoService.js';
import { DeleteContratoService } from '../../services/contrato/deleteContratoService.js';

export class DeleteContratoController extends AbstractController {
  constructor(req, res) {
    super(req, res);
  }

  async execute() {
    try {
      const id = this.req.validatedId || this.req.params.id;
      const contrato = await GetContratoService.handle(id);

      if (!contrato) {
        return this.res.status(404).json({
          message: this.req.t('contratos.get.not_found')
        });
      }

      await DeleteContratoService.handle(id);

      return this.res.status(204).json();
    } catch (error) {
      return this.handleError(error, 'contratos.delete.error');
    }
  }

  static async handle(req, res) {
    const controller = new DeleteContratoController(req, res);
    await controller.execute();
  }
}
