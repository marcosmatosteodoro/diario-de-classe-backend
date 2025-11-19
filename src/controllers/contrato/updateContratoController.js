import AbstractController from '../abstractController.js';
import { GetContratoService } from '../../services/contrato/getContratoService.js';
import { UpdateContratoService } from '../../services/contrato/updateContratoService.js';

export class UpdateContratoController extends AbstractController {
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

      const updatedContrato = await UpdateContratoService.handle(id, this.req.body);

      return this.res.status(200).json(updatedContrato);
    } catch (error) {
      return this.handleError(error, 'contratos.update.error');
    }
  }

  static async handle(req, res) {
    const controller = new UpdateContratoController(req, res);
    await controller.execute();
  }
}
