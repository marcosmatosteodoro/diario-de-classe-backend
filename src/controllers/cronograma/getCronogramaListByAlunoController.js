import { AbstractCronogramaController } from './AbstractCronogramaController.js';
import { GetCronogramaListByAlunoService } from '../../services/cronograma/getCronogramaListByAlunoService.js';

/**
 * Historico de livros do aluno, do mais recente para o mais antigo.
 */
export class GetCronogramaListByAlunoController extends AbstractCronogramaController {
  constructor(req, res) {
    super(req, res);
  }

  async execute() {
    try {
      const idAluno = this.req.validatedId || this.req.params.id;
      const aluno = await this.getAlunoAcessivel(idAluno);

      if (!aluno) {
        return this.res.status(404).json({
          message: this.req.t('alunos.get.not_found')
        });
      }

      const cronogramas = await GetCronogramaListByAlunoService.handle(idAluno, this.where);

      if (!cronogramas || cronogramas.length === 0) {
        return this.res.status(204).json();
      }

      return this.res.status(200).json({
        count: cronogramas.length,
        data: cronogramas
      });
    } catch (error) {
      return this.handleError(error, 'cronogramas.list.error');
    }
  }

  static async handle(req, res) {
    const controller = new GetCronogramaListByAlunoController(req, res);
    await controller.execute();
  }
}
