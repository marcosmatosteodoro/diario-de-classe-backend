import AbstractController from '../abstractController.js';
import { CreateContratoService } from '../../services/contrato/createContratoService.js';
import { IsContratoAlunoAtivoExistsService } from '../../services/contrato/isContratoAlunoAtivoExistsService.js';
import { IsContratoAlunoPendenteExistsService } from '../../services/contrato/isContratoAlunoPendenteExistsService.js';

export class CreateContratoController extends AbstractController {
  constructor(req, res) {
    super(req, res);
    this.idAluno = req.body.idDoAluno;
  }

  async execute() {
    try {
      if (await IsContratoAlunoAtivoExistsService.handle(this.idAluno)) {
        return this.res.status(400).json({
          message: this.req.t('contratos.create.aluno_ativo_exists')
        });
      }

      if (await IsContratoAlunoPendenteExistsService.handle(this.idAluno)) {
        return this.res.status(400).json({
          message: this.req.t('contratos.create.aluno_pendente_exists')
        });
      }

      const newContrato = await CreateContratoService.handle(this.req.body);

      return this.res.status(201).json(newContrato);
    } catch (error) {
      return this.handleError(error, 'contratos.create.error');
    }
  }

  static async handle(req, res) {
    const controller = new CreateContratoController(req, res);
    await controller.execute();
  }
}
