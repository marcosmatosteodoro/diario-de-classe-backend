import { AbstractContratoController } from './AbstractContratoController.js';
import { GetContratoListService } from '../../services/contrato/getContratoListService.js';

export class GetContratosByAlunoController extends AbstractContratoController {
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
      const contratos = await GetContratoListService.handle(this.where);

      if (!contratos || contratos.length === 0) {
        return this.res.status(404).json({
          message: this.req.t('contratos.get.not_found')
        });
      }

      return this.res.status(200).json(contratos);
    } catch (error) {
      return this.handleError(error, 'contratos.get.error');
    }
  }

  static async handle(req, res) {
    const controller = new GetContratosByAlunoController(req, res);
    await controller.execute();
  }
}
