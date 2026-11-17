import { AbstractAulaController } from './AbstractAulaController.js';
import { GetAulaListService } from '../../services/aula/getAulaListService.js';

export class GetAulasByProfessorController extends AbstractAulaController {
  constructor(req, res) {
    super(req, res);
  }

  async execute() {
    try {
      if (!this.req.user.isAdmin && this.req.user.id == null) {
        return this.res.status(403).json({ message: this.req.t('api.errors.forbidden') });
      }

      const idProfessor = this.req.validatedId || this.req.params.id;

      const negocio = { idProfessor };
      this.where = this.req.user.isAdmin ? negocio : { AND: [this.where, negocio] };

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
    const controller = new GetAulasByProfessorController(req, res);
    await controller.execute();
  }
}
