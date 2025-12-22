import AbstractController from '../abstractController.js';
import { GetDiaAulaListService } from '../../services/diaAula/getDiaAulaListService.js';

export class GetDiaAulaListByContratoController extends AbstractController {
  constructor(req, res) {
    super(req, res);
    this.where = {};
  }

  async execute() {
    try {
      const idContrato = this.req.validatedId || this.req.params.id;
      this.where = { idContrato: idContrato };

      const diaAulas = await GetDiaAulaListService.handle(this.where);

      if (!diaAulas || diaAulas.length === 0) {
        return this.res.status(204).json();
      }

      return this.res.status(200).json(diaAulas);
    } catch (error) {
      return this.handleError(error, 'diaAulas.list.error');
    }
  }

  static async handle(req, res) {
    const controller = new GetDiaAulaListByContratoController(req, res);
    await controller.execute();
  }
}
