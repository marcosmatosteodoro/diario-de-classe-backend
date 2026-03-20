import { GetAulaListService } from '../../services/aula/getAulaListService.js';
import { AbstractAulaController } from './AbstractAulaController.js';

export class GetAulaListController extends AbstractAulaController {
  constructor(req, res) {
    super(req, res);
  }

  bindMainWhere() {
    const { dataInicio, dataTermino } = this.req.query;

    if (dataInicio) {
      const dataFim = dataTermino || dataInicio;
      this.where.dataAula = {
        gte: new Date(`${dataInicio}T00:00:00.000Z`),
        lte: new Date(`${dataFim}T23:59:59.999Z`)
      };
    }
  }

  async execute() {
    try {
      if (this.req.query.q) {
        this.getWhereClauseByQuerySearch({
          query: this.req.query.q,
          fields: ['horaInicial', 'horaFinal']
        });
      }

      this.bindMainWhere();

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
    return await controller.execute();
  }
}
