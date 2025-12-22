import AbstractController from '../abstractController.js';
import { GetUserService } from '../../services/user/getUserService.js';
import { GetDisponibilidadeProfessorListService } from '../../services/disponibilidadeProfessor/getDisponibilidadeProfessorListService.js';

export class GetDisponibilidadeProfessorController extends AbstractController {
  constructor(req, res) {
    super(req, res);
  }

  async execute() {
    try {
      const id = this.req.validatedId || this.req.params.id;
      const user = await GetUserService.handle(id);

      if (!user) {
        return this.res.status(404).json({
          message: this.req.t('users.get.not_found')
        });
      }

      const disponibilidades = await GetDisponibilidadeProfessorListService.handle({
        userId: id
      });

      if (disponibilidades.length === 0) {
        return this.res.status(204).json();
      }

      return this.res.status(200).json(disponibilidades);
    } catch (error) {
      return this.handleError(error, 'disponibilidades.list.error');
    }
  }

  static async handle(req, res) {
    const controller = new GetDisponibilidadeProfessorController(req, res);
    await controller.execute();
  }
}
