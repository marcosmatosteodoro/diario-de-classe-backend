import AbstractController from '../abstractController.js';
import { GetContratoListService } from '../../services/contrato/getContratoListService.js';

export class GetContratoByAlunoController extends AbstractController {
  constructor(req, res) {
    super(req, res);
    this.where = {};
  }

  async execute() {
    try {
      const idAluno = this.req.validatedId || this.req.params.id;
      this.where = { idDoAluno: idAluno, status: { in: ['ATIVO', 'PENDENTE'] } };
      const contratos = await GetContratoListService.handle(this.where);

      if (!contratos || contratos.length === 0) {
        return this.res.status(404).json({
          message: this.req.t('contratos.get.not_found')
        });
      }

      const contrato = contratos[0];

      return this.res.status(200).json(contrato);
    } catch (error) {
      return this.handleError(error, 'contratos.get.error');
    }
  }

  static async handle(req, res) {
    const controller = new GetContratoByAlunoController(req, res);
    await controller.execute();
  }
}
