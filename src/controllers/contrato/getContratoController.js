import { GetContratoService } from '../../services/contrato/getContratoService.js';
import { AbstractContratoController } from './AbstractContratoController.js';

export class GetContratoController extends AbstractContratoController {
  constructor(req, res) {
    super(req, res);
  }

  async execute() {
    try {
      const id = this.req.validatedId || this.req.params.id;
      const params = this.req.query || {};
      params.additionalWhere = this.where;
      params.withRelations = true;
      const contrato = await GetContratoService.handle(id, params);

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
