import AbstractController from '../abstractController.js';
import { GetAlunoListService } from '../../services/aluno/getAlunoListService.js';
import { getWhereClauseByQuerySearch } from '../../utilities/getWhereClauseByQuerySearch.js';

export class GetAlunoListController extends AbstractController {
  constructor(req, res) {
    super(req, res);
    this.where = {};
  }

  async execute() {
    try {
      if (this.req.query.q) {
        this.where = getWhereClauseByQuerySearch({
          query: this.req.query.q,
          fields: ['nome', 'sobrenome', 'email', 'telefone']
        });
      }

      const alunos = await GetAlunoListService.handle(this.where);

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
    const controller = new GetAlunoListController(req, res);
    await controller.execute();
  }
}
