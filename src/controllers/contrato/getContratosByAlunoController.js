import AbstractController from '../abstractController.js';
import { GetContratoListService } from '../../services/contrato/getContratoListService.js';

export class GetContratosByAlunoController extends AbstractController {
  constructor(req, res) {
    super(req, res);
    this.where = {};
  }

  async execute() {
    try {
      const idAluno = this.req.validatedId || this.req.params.id;
      this.where = { idAluno: idAluno };
      const contratos = await GetContratoListService.handle(this.where);

      if (!contratos || contratos.length === 0) {
        return this.res.status(404).json({
          message: this.req.t('contratos.get.not_found')
        });
      }

      return this.res.status(200).json(contratos);
    } catch (error) {
      return this.handleError(error, 'contratos.get.error');
    }
  }

  static async handle(req, res) {
    const controller = new GetContratosByAlunoController(req, res);
    await controller.execute();
  }
}
