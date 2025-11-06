import AbstractController from '../abstractController.js';
import { GetAlunoService } from '../../services/aluno/getAlunoService.js';
import { UpdateAlunoService } from '../../services/aluno/updateAlunoService.js';
import { IsAlunoEmailExistsService } from '../../services/aluno/isAlunoEmailExistsService.js';

export class UpdateAlunoController extends AbstractController {
  constructor(req, res) {
    super(req, res);
  }

  async execute() {
    try {
      const id = this.req.validatedId || this.req.params.id;
      const aluno = await GetAlunoService.handle(id);

      if (!aluno) {
        return this.res.status(404).json({
          message: this.req.t('alunos.get.not_found')
        });
      }

      if (
        aluno.email !== this.req.body.email &&
        (await IsAlunoEmailExistsService.handle(this.req.body.email))
      ) {
        return this.res.status(409).json({
          message: this.req.t('alunos.create.email_exists')
        });
      }

      const updatedAluno = await UpdateAlunoService.handle(id, this.req.body);

      return this.res.status(200).json(updatedAluno);
    } catch (error) {
      return this.handleError(error, 'alunos.update.error');
    }
  }

  static async handle(req, res) {
    const controller = new UpdateAlunoController(req, res);
    await controller.execute();
  }
}
