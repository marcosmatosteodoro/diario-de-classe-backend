import { GetDiaAulaService } from '../../services/diaAula/getDiaAulaService.js';
import { AbstractDiaAulaController } from './AbstractDiaAulaController.js';

export class GetDiaAulaController extends AbstractDiaAulaController {
  constructor(req, res) {
    super(req, res);
  }

  async execute() {
    try {
      const id = this.req.validatedId || this.req.params.id;
      const diaAula = await GetDiaAulaService.handle(id, this.where);

      if (!diaAula) {
        return this.res.status(404).json({
          message: this.req.t('diaAulas.get.not_found')
        });
      }

      return this.res.status(200).json(diaAula);
    } catch (error) {
      return this.handleError(error, 'diaAulas.get.error');
    }
  }

  static async handle(req, res) {
    const controller = new GetDiaAulaController(req, res);
    await controller.execute();
  }
}
