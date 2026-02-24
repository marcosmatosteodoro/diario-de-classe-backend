import { GetAulaService } from '../../services/aula/getAulaService.js';
import { AbstractAulaController } from './AbstractAulaController.js';

export class GetAulaController extends AbstractAulaController {
  constructor(req, res) {
    super(req, res);
  }

  async execute() {
    try {
      // Usa o ID validado pelo middleware se disponível, senão usa o parâmetro original
      const id = this.req.validatedId || this.req.params.id;
      const aula = await GetAulaService.handle(id, this.where);

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
