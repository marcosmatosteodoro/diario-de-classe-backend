import { AbstractAulaController } from './AbstractAulaController.js';
import { CreateAulaService } from '../../services/aula/createAulaService.js';
import { IsAulaExistsService } from '../../services/aula/isAulaExistsService.js';
import { UpdateAulasContratoService } from '../../services/contrato/updateAulasContratoService.js';

export class CreateAulaController extends AbstractAulaController {
  async execute() {
    try {
      if (!this.req.user.isAdmin && !this.req.user.id) {
        return this.res.status(403).json({ message: this.req.t('api.errors.forbidden') });
      }

      const body = this.req.user.isAdmin
        ? this.req.body
        : { ...this.req.body, idProfessor: this.req.user.id };

      if (await IsAulaExistsService.handle(body)) {
        return this.res.status(422).json({
          message: this.req.t('aulas.create.ids_exists')
        });
      }

      const data = {
        ...body,
        status: 'AGENDADA'
      };

      const newAula = await CreateAulaService.handle(data);
      await UpdateAulasContratoService.handle(newAula.idContrato);

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
