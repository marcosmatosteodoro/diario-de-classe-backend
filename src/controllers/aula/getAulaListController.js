import AbstractController from '../abstractController.js';
import { GetAulaListService } from '../../services/aula/getAulaListService.js';

export class GetAulaListController extends AbstractController {
  constructor(req, res) {
    super(req, res);
    this.where = {};
  }

  async execute() {
    try {
      if (this.req.query.q) {
        this.getWhereClauseByQuerySearch({
          query: this.req.query.q,
          fields: ['horaInicial', 'horaFinal']
        });
      }

      const aulas = await GetAulaListService.handle(this.where);

      if (!aulas || aulas.length === 0) {
        return this.res.status(204).json();
      }

      return this.res.status(200).json({
        count: aulas.length,
        data: aulas
      });
    } catch (error) {
      return this.handleError(error, 'aulas.list.error');
    }
  }

  static async handle(req, res) {
    const controller = new GetAulaListController(req, res);
    await controller.execute();
  }
}
