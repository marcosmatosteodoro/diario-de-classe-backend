import AbstractController from '../abstractController.js';
import { CreateAlunoService } from '../../services/aluno/createAlunoService.js';
import { IsAlunoEmailExistsService } from '../../services/aluno/isAlunoEmailExistsService.js';

export class CreateAlunoController extends AbstractController {
  constructor(req, res) {
    super(req, res);
  }

  async execute() {
    try {
      if (await IsAlunoEmailExistsService.handle(this.req.body.email)) {
        return this.res.status(409).json({
          message: this.req.t('alunos.create.email_exists')
        });
      }

      const newAluno = await CreateAlunoService.handle(this.req.body);

      return this.res.status(201).json(newAluno);
    } catch (error) {
      return this.handleError(error, 'alunos.create.error');
    }
  }

  static async handle(req, res) {
    const controller = new CreateAlunoController(req, res);
    await controller.execute();
  }
}
