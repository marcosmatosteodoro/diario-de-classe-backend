import AbstractController from '../abstractController.js';
import { UpdateDisponibilidadeProfessorService } from '../../services/disponibilidadeProfessor/updateDisponibilidadeProfessorService.js';
import { GetUserService } from '../../services/user/getUserService.js';
import { CreateDisponibilidadeProfessorService } from '../../services/disponibilidadeProfessor/createDisponibilidadeProfessorService.js';

export class UpdateDisponibilidadeProfessorController extends AbstractController {
  constructor(req, res) {
    super(req, res);
  }

  async execute() {
    // TODO a criação da disponibilidade tem que respeitar a configuração
    try {
      const id = this.req.validatedId || this.req.params.id;
      const user = await GetUserService.handle(id);
      const updatedDisponibilidades = [];

      if (!user) {
        return this.res.status(404).json({
          message: this.req.t('users.get.not_found')
        });
      }

      const disponibilidades = this.req.body;

      for (const disponibilidade of disponibilidades) {
        let updated = null;
        if (disponibilidade.id) {
          updated = await UpdateDisponibilidadeProfessorService.handle(
            disponibilidade.id,
            disponibilidade
          );
          updated.action = 'updated';
        } else {
          updated = await CreateDisponibilidadeProfessorService.handle(disponibilidade);
          updated.action = 'created';
        }
        updatedDisponibilidades.push(updated);
      }

      return this.res.status(200).json(updatedDisponibilidades);
    } catch (error) {
      return this.handleError(error, 'disponibilidadeProfessors.update.error');
    }
  }

  static async handle(req, res) {
    const controller = new UpdateDisponibilidadeProfessorController(req, res);
    await controller.execute();
  }
}
