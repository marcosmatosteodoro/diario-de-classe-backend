import AbstractController from '../abstractController.js';
import { GetContratoListService } from '../../services/contrato/getContratoListService.js';

export class GetContratoListController extends AbstractController {
  constructor(req, res) {
    super(req, res);
    this.where = {};
  }

  async execute() {
    try {
      const contratos = await GetContratoListService.handle(this.where);

      if (!contratos || contratos.length === 0) {
        return this.res.status(204).json();
      }

      return this.res.status(200).json({
        count: contratos.length,
        data: contratos
      });
    } catch (error) {
      return this.handleError(error, 'contratos.list.error');
    }
  }

  static async handle(req, res) {
    const controller = new GetContratoListController(req, res);
    await controller.execute();
  }
}
