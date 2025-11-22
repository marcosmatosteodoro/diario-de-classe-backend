import AbstractController from '../abstractController.js';
import { CreateAulaService } from '../../services/aula/createAulaService.js';
import { IsAulaExistsService } from '../../services/aula/isAulaExistsService.js';

export class CreateAulaController extends AbstractController {
  constructor(req, res) {
    super(req, res);
  }

  async execute() {
    try {
      if (await IsAulaExistsService.handle(this.req.body)) {
        return this.res.status(422).json({
          message: this.req.t('aulas.create.ids_exists')
        });
      }

      const data = {
        ...this.req.body,
        status: 'AGENDADA'
      };

      const newAula = await CreateAulaService.handle(data);

      return this.res.status(201).json(newAula);
    } catch (error) {
      return this.handleError(error, 'aulas.create.error');
    }
  }

  static async handle(req, res) {
    const controller = new CreateAulaController(req, res);
    await controller.execute();
  }
}
