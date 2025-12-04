import AbstractController from '../abstractController.js';
import { GetAulaListService } from '../../services/aula/getAulaListService.js';

export class GetAulasByAlunoController extends AbstractController {
  constructor(req, res) {
    super(req, res);
    this.where = {};
  }

  async execute() {
    try {
      const idAluno = this.req.validatedId || this.req.params.id;

      this.where = {
        idAluno
      };

      const aulas = await GetAulaListService.handle(this.where);

      if (!aulas || aulas.length === 0) {
        return this.res.status(204).json();
      }

      return this.res.status(200).json(aulas);
    } catch (error) {
      return this.handleError(error, 'aulas.list.error');
    }
  }

  static async handle(req, res) {
    const controller = new GetAulasByAlunoController(req, res);
    await controller.execute();
  }
}
