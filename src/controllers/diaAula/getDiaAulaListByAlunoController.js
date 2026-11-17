import { AbstractDiaAulaController } from './AbstractDiaAulaController.js';
import { GetDiaAulaListService } from '../../services/diaAula/getDiaAulaListService.js';
import { GetContratoListService } from '../../services/contrato/getContratoListService.js';

export class GetDiaAulaListByAlunoController extends AbstractDiaAulaController {
  constructor(req, res) {
    super(req, res);
  }

  async execute() {
    try {
      if (!this.req.user.isAdmin && this.req.user.id == null) {
        return this.res.status(403).json({ message: this.req.t('api.errors.forbidden') });
      }

      const idAluno = this.req.validatedId || this.req.params.id;
      const negocio = { idAluno };
      this.where = this.req.user.isAdmin ? negocio : { AND: [this.where, negocio] };

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
