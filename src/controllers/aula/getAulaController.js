import AbstractController from '../abstractController.js';
import { GetAulaService } from '../../services/aula/getAulaService.js';

export class GetAulaController extends AbstractController {
  constructor(req, res) {
    super(req, res);
  }

  async execute() {
    try {
      // Usa o ID validado pelo middleware se disponível, senão usa o parâmetro original
      const id = this.req.validatedId || this.req.params.id;
      const aula = await GetAulaService.handle(id);

      if (!aula) {
        return this.res.status(404).json({
          message: this.req.t('aulas.get.not_found')
        });
      }

      return this.res.status(200).json(aula);
    } catch (error) {
      return this.handleError(error, 'aulas.get.error');
    }
  }

  static async handle(req, res) {
    const controller = new GetAulaController(req, res);
    await controller.execute();
  }
}
