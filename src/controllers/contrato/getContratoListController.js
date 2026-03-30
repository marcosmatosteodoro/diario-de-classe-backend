import { GetContratoListService } from '../../services/contrato/getContratoListService.js';
import { AbstractContratoController } from './AbstractContratoController.js';

export class GetContratoListController extends AbstractContratoController {
  constructor(req, res) {
    super(req, res);
    this.bindMainWhere();
  }

  bindMainWhere() {
    const { dataInicio, dataTermino, aluno, idioma, q } = this.req.query;

    if (dataInicio) {
      this.where.dataInicio = {
        gte: new Date(`${dataInicio}T00:00:00.000Z`)
      };
    }

    if (dataTermino) {
      this.where.dataTermino = {
        lte: new Date(`${dataTermino}T23:59:59.999Z`)
      };
    }

    if (idioma) {
      this.where.idioma = idioma;
    }

    if (aluno) {
      this.where.aluno = {
        nome: {
          contains: aluno,
          mode: 'insensitive'
        }
      };
    }

    if (q) {
      this.where.OR = [
        {
          aluno: {
            nome: {
              contains: q,
              mode: 'insensitive'
            }
          }
        }
      ];
    }
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
