import AbstractController from '../abstractController.js';
import { CreateContratoService } from '../../services/contrato/createContratoService.js';
import { IsContratoAlunoAtivoExistsService } from '../../services/contrato/isContratoAlunoAtivoExistsService.js';
import { IsContratoAlunoPendenteExistsService } from '../../services/contrato/isContratoAlunoPendenteExistsService.js';
import { GetAlunoService } from '../../services/aluno/getAlunoService.js';

export class CreateContratoController extends AbstractController {
  constructor(req, res) {
    super(req, res);
    this.idAluno = req.body.idAluno;
  }

  async execute() {
    try {
      const aluno = await GetAlunoService.handle(this.idAluno);

      if (!aluno) {
        return this.res.status(404).json({
          message: this.req.t('alunos.get.not_found')
        });
      }

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

      const data = this.req.body;
      if (data.dataInicio) data.dataInicio = new Date(data.dataInicio);
      if (data.dataTermino) data.dataTermino = new Date(data.dataTermino);

      const newContrato = await CreateContratoService.handle(data);

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
