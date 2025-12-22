import AbstractController from '../abstractController.js';
import { GetAlunoService } from '../../services/aluno/getAlunoService.js';
import { DeleteAlunoService } from '../../services/aluno/deleteAlunoService.js';

export class DeleteAlunoController extends AbstractController {
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

      await DeleteAlunoService.handle(id);

      return this.res.status(204).json();
    } catch (error) {
      return this.handleError(error, 'alunos.delete.error');
    }
  }

  static async handle(req, res) {
    const controller = new DeleteAlunoController(req, res);
    await controller.execute();
  }
}
