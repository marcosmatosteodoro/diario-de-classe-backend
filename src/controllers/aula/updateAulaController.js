import { GetAulaService } from '../../services/aula/getAulaService.js';
import { UpdateAulaService } from '../../services/aula/updateAulaService.js';
import { UpdateAulasContratoService } from '../../services/contrato/updateAulasContratoService.js';
import { AbstractAulaController } from './AbstractAulaController.js';

export class UpdateAulaController extends AbstractAulaController {
  constructor(req, res) {
    super(req, res);
  }

  async execute() {
    try {
      const id = this.req.validatedId || this.req.params.id;
      const aula = await GetAulaService.handle(id, this.where);

      if (!aula) {
        return this.res.status(404).json({
          message: this.req.t('aulas.get.not_found')
        });
      }

      if (this.isChangeSomeOfIds(aula)) {
        return this.res.status(422).json({
          message: this.req.t('aulas.update.ids_change_not_allowed')
        });
      }

      // this.removeStatus();

      const updatedAula = await UpdateAulaService.handle(id, this.req.body);
      await UpdateAulasContratoService.handle(updatedAula.idContrato);

      return this.res.status(200).json(updatedAula);
    } catch (error) {
      return this.handleError(error, 'aulas.update.error');
    }
  }

  isChangeSomeOfIds(aula) {
    const isChangeAluno = this.req.body.idAluno && aula.idAluno !== this.req.body.idAluno;
    const isChangeProfessor =
      this.req.body.idProfessor && aula.idProfessor !== this.req.body.idProfessor;
    const isChangeContrato =
      this.req.body.idContrato && aula.idContrato !== this.req.body.idContrato;

    return isChangeAluno || isChangeProfessor || isChangeContrato;
  }

  // removeStatus() {
  //   if (this.req.body.status) {
  //     delete this.req.body.status;
  //   }
  // }

  static async handle(req, res) {
    const controller = new UpdateAulaController(req, res);
    await controller.execute();
  }
}
