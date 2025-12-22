import AbstractController from '../abstractController.js';
import { GetDiaAulaService } from '../../services/diaAula/getDiaAulaService.js';

export class GetDiaAulaController extends AbstractController {
  constructor(req, res) {
    super(req, res);
  }

  async execute() {
    try {
      const id = this.req.validatedId || this.req.params.id;
      const diaAula = await GetDiaAulaService.handle(id);

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
