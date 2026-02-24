import { GetDiaAulaListService } from '../../services/diaAula/getDiaAulaListService.js';
import { AbstractDiaAulaController } from './AbstractDiaAulaController.js';

export class GetDiaAulaListController extends AbstractDiaAulaController {
  constructor(req, res) {
    super(req, res);
  }

  async execute() {
    try {
      if (this.req.query.q) {
        this.getWhereClauseByQuerySearch({
          query: this.req.query.q,
          fields: ['diaSemana', 'quantidadeAulas', 'horaInicial', 'horaFinal']
        });
      }

      const diaAulas = await GetDiaAulaListService.handle(this.where);

      if (!diaAulas || diaAulas.length === 0) {
        return this.res.status(204).json();
      }

      return this.res.status(200).json({
        count: diaAulas.length,
        data: diaAulas
      });
    } catch (error) {
      return this.handleError(error, 'diaAulas.list.error');
    }
  }

  static async handle(req, res) {
    const controller = new GetDiaAulaListController(req, res);
    await controller.execute();
  }
}
