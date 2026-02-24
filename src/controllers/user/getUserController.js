import AbstractController from '../abstractController.js';
import { GetUserService } from '../../services/user/getUserService.js';
import { GetAulaListService } from '../../services/aula/getAulaListService.js';
import { GetAlunoListService } from '../../services/aluno/getAlunoListService.js';

export class GetUserController extends AbstractController {
  constructor(req, res) {
    super(req, res);
  }

  async execute() {
    try {
      // Usa o ID validado pelo middleware se disponível, senão usa o parâmetro original
      const id = this.req.validatedId || this.req.params.id;
      const user = await GetUserService.handle(id, true);

      if (!user) {
        return this.res.status(404).json({
          message: this.req.t('users.get.not_found')
        });
      }

      user.aulas = await GetAulaListService.handle({ idProfessor: id });
      const idAlunos = user.aulas.map(aula => aula.idAluno);
      user.alunos = await GetAlunoListService.handle({ id: { in: idAlunos } });

      return this.res.status(200).json(user);
    } catch (error) {
      return this.handleError(error, 'users.get.error');
    }
  }

  static async handle(req, res) {
    const controller = new GetUserController(req, res);
    await controller.execute();
  }
}
