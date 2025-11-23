import AbstractController from '../abstractController.js';
import { GetAlunoListService } from '../../services/aluno/getAlunoListService.js';
import { GetAulaListService } from '../../services/aula/getAulaListService.js';

export class GetAlunosByProfessorController extends AbstractController {
  constructor(req, res) {
    super(req, res);
  }

  async execute() {
    try {
      const idProfessor = this.req.validatedId || this.req.params.id;
      const aulas = await GetAulaListService.handle({ idProfessor });

      if (!aulas || aulas.length === 0) {
        return this.res.status(204).json();
      }

      const idAlunos = aulas.map(aula => aula.idAluno);
      const alunos = await GetAlunoListService.handle({ id: { in: idAlunos } });

      if (!alunos || alunos.length === 0) {
        return this.res.status(204).json();
      }

      return this.res.status(200).json({
        count: alunos.length,
        data: alunos
      });
    } catch (error) {
      return this.handleError(error, 'alunos.list.error');
    }
  }

  static async handle(req, res) {
    const controller = new GetAlunosByProfessorController(req, res);
    await controller.execute();
  }
}
