import AbstractController from '../abstractController.js';
import { CreateAulaService } from '../../services/aula/createAulaService.js';
import { IsAulaExistsService } from '../../services/aula/isAulaExistsService.js';

export class CreateAulaController extends AbstractController {
  constructor(req, res) {
    super(req, res);
  }

  async execute() {
    try {
      const ids = {
        idAluno: this.req.body.idAluno,
        idProfessor: this.req.body.idProfessor,
        idContrato: this.req.body.idContrato
      };

      if (await IsAulaExistsService.handle(ids)) {
        return this.res.status(422).json({
          message: this.req.t('aulas.create.ids_exists')
        });
      }

      const newAula = await CreateAulaService.handle(this.req.body);

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
