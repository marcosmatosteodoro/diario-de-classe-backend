import AbstractController from '../abstractController.js';
import { GetAulaService } from '../../services/aula/getAulaService.js';
import { UpdateAulaService } from '../../services/aula/updateAulaService.js';

export class UpdateAulaController extends AbstractController {
  constructor(req, res) {
    super(req, res);
  }

  async execute() {
    try {
      const id = this.req.validatedId || this.req.params.id;
      const aula = await GetAulaService.handle(id);
      const ids = {
        idAluno: this.req.body.idAluno,
        idProfessor: this.req.body.idProfessor,
        idContrato: this.req.body.idContrato
      };
      const isChangeSomeOfIds =
        aula.idAluno !== ids.idAluno ||
        aula.idProfessor !== ids.idProfessor ||
        aula.idContrato !== ids.idContrato;

      if (!aula) {
        return this.res.status(404).json({
          message: this.req.t('aulas.get.not_found')
        });
      }

      if (isChangeSomeOfIds) {
        return this.res.status(422).json({
          message: this.req.t('aulas.update.ids_change_not_allowed')
        });
      }

      const updatedAula = await UpdateAulaService.handle(id, this.req.body);

      return this.res.status(200).json(updatedAula);
    } catch (error) {
      return this.handleError(error, 'aulas.update.error');
    }
  }

  static async handle(req, res) {
    const controller = new UpdateAulaController(req, res);
    await controller.execute();
  }
}
