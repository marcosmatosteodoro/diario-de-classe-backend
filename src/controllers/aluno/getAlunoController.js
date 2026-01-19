import { AbstractAlunoController } from './AbstractAlunoController.js';
import { GetAlunoService } from '../../services/aluno/getAlunoService.js';

export class GetAlunoController extends AbstractAlunoController {
  constructor(req, res) {
    super(req, res);
  }

  async execute() {
    try {
      // Usa o ID validado pelo middleware se disponível, senão usa o parâmetro original
      const id = this.req.validatedId || this.req.params.id;
      const aluno = await GetAlunoService.handle(id, this.where);

      if (!aluno) {
        return this.res.status(404).json({
          message: this.req.t('alunos.get.not_found')
        });
      }

      return this.res.status(200).json(aluno);
    } catch (error) {
      return this.handleError(error, 'alunos.get.error');
    }
  }

  static async handle(req, res) {
    const controller = new GetAlunoController(req, res);
    await controller.execute();
  }
}
