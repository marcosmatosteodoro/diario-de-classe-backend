import AbstractController from '../abstractController.js';
import { CreateUserService } from '../../services/user/createUserService.js';
import { IsUserEmailExistsService } from '../../services/user/isUserEmailExistsService.js';
import { CreateDisponibilidadeProfessorService } from '../../services/disponibilidadeProfessor/createDisponibilidadeProfessorService.js';

export class CreateUserController extends AbstractController {
  constructor(req, res) {
    super(req, res);
    this.diasAtivos = ['SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA'];
    this.diasInativos = ['SABADO', 'DOMINGO'];
  }

  async execute() {
    try {
      if (await IsUserEmailExistsService.handle(this.req.body.email)) {
        return this.res.status(409).json({
          message: this.req.t('users.create.email_exists')
        });
      }

      const newUser = await CreateUserService.handle(this.req.body);

      for (const dia of this.diasAtivos) {
        const disponibilidade = await CreateDisponibilidadeProfessorService.handle(
          this.getDisponibilidade({ dia, isAtivo: true, id: newUser.id })
        );

        newUser.disponibilidades.push(disponibilidade);
      }

      for (const dia of this.diasInativos) {
        const disponibilidade = await CreateDisponibilidadeProfessorService.handle(
          this.getDisponibilidade({ dia, isAtivo: false, id: newUser.id })
        );

        newUser.disponibilidades.push(disponibilidade);
      }

      return this.res.status(201).json(newUser);
    } catch (error) {
      return this.handleError(error, 'users.create.error');
    }
  }

  getDisponibilidade({ dia, isAtivo, id }) {
    return {
      diaDaSemana: dia,
      horaInicial: '08:00',
      horaFinal: '12:00',
      ativo: isAtivo,
      userId: id
    };
  }

  static async handle(req, res) {
    const controller = new CreateUserController(req, res);
    await controller.execute();
  }
}
