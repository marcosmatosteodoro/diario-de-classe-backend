import AbstractController from '../abstractController.js';
import { GetDiaAulaListService } from '../../services/diaAula/getDiaAulaListService.js';
import { GetContratoListService } from '../../services/contrato/getContratoListService.js';

export class GetDiaAulaListByAlunoController extends AbstractController {
  constructor(req, res) {
    super(req, res);
    this.where = {};
  }

  async execute() {
    try {
      const idAluno = this.req.validatedId || this.req.params.id;
      this.where = { idAluno: idAluno };

      let diaAulas = await GetDiaAulaListService.handle(this.where);

      if (!diaAulas || diaAulas.length === 0) {
        return this.res.status(204).json();
      }

      if (!this.areAllContractsTheSame(diaAulas)) {
        const contratosIds = [...new Set(diaAulas.map(diaAula => diaAula.contratoId))];
        const contratos = await GetContratoListService.handle({
          id: contratosIds,
          status: 'ATIVO'
        });

        diaAulas = diaAulas.filter(diaAula =>
          contratos.some(contrato => contrato.id === diaAula.contratoId)
        );
      }

      return this.res.status(200).json(diaAulas);
    } catch (error) {
      return this.handleError(error, 'diaAulas.list.error');
    }
  }

  areAllContractsTheSame(diaAulas) {
    const contratoRef = diaAulas[0].contratoId;
    return diaAulas.every(diaAula => diaAula.contratoId === contratoRef);
  }

  static async handle(req, res) {
    const controller = new GetDiaAulaListByAlunoController(req, res);
    await controller.execute();
  }
}
