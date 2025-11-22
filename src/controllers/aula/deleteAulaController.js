import AbstractController from '../abstractController.js';
import { GetAulaService } from '../../services/aula/getAulaService.js';
import { DeleteAulaService } from '../../services/aula/deleteAulaService.js';

export class DeleteAulaController extends AbstractController {
  constructor(req, res) {
    super(req, res);
  }

  async execute() {
    try {
      const id = this.req.validatedId || this.req.params.id;
      const aula = await GetAulaService.handle(id);

      if (!aula) {
        return this.res.status(404).json({
          message: this.req.t('aulas.get.not_found')
        });
      }

      await DeleteAulaService.handle(id);

      return this.res.status(204).json();
    } catch (error) {
      return this.handleError(error, 'aulas.delete.error');
    }
  }

  static async handle(req, res) {
    const controller = new DeleteAulaController(req, res);
    await controller.execute();
  }
}
