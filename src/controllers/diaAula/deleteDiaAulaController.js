import AbstractController from '../abstractController.js';
import { GetDiaAulaService } from '../../services/diaAula/getDiaAulaService.js';
import { DeleteDiaAulaService } from '../../services/diaAula/deleteDiaAulaService.js';

export class DeleteDiaAulaController extends AbstractController {
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

      await DeleteDiaAulaService.handle(id);

      return this.res.status(204).json();
    } catch (error) {
      return this.handleError(error, 'diaAulas.delete.error');
    }
  }

  static async handle(req, res) {
    const controller = new DeleteDiaAulaController(req, res);
    await controller.execute();
  }
}
