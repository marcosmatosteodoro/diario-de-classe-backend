import AbstractController from '../abstractController.js';
import { GetAulaListService } from '../../services/aula/getAulaListService.js';

export class GetAulasByContratoController extends AbstractController {
  constructor(req, res) {
    super(req, res);
    this.where = {};
  }

  async execute() {
    try {
      const idContrato = this.req.validatedId || this.req.params.id;

      this.where = {
        idContrato
      };

      const aulas = await GetAulaListService.handle(this.where);

      if (!aulas || aulas.length === 0) {
        return this.res.status(204).json();
      }

      return this.res.status(200).json(aulas);
    } catch (error) {
      return this.handleError(error, 'aulas.list.error');
    }
  }

  static async handle(req, res) {
    const controller = new GetAulasByContratoController(req, res);
    await controller.execute();
  }
}
