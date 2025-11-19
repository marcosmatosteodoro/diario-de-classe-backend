import AbstractController from '../abstractController.js';
import { GetContratoService } from '../../services/contrato/getContratoService.js';

export class GetContratoController extends AbstractController {
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

      return this.res.status(200).json(contrato);
    } catch (error) {
      return this.handleError(error, 'contratos.get.error');
    }
  }

  static async handle(req, res) {
    const controller = new GetContratoController(req, res);
    await controller.execute();
  }
}
