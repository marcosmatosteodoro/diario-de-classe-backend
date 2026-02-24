import { AbstractAlunoController } from './AbstractAlunoController.js';
import { GetAlunoService } from '../../services/aluno/getAlunoService.js';
import { GetAulaListService } from '../../services/aula/getAulaListService.js';
import { GetDiaAulaListService } from '../../services/diaAula/getDiaAulaListService.js';
import { GetContratoListService } from '../../services/contrato/getContratoListService.js';

export class GetAlunoController extends AbstractAlunoController {
  constructor(req, res) {
    super(req, res);
  }

  async execute() {
    try {
      // Usa o ID validado pelo middleware se disponível, senão usa o parâmetro original
      const idAluno = this.req.validatedId || this.req.params.id;
      const aluno = await GetAlunoService.handle(idAluno, this.where);

      if (!aluno) {
        return this.res.status(404).json({
          message: this.req.t('alunos.get.not_found')
        });
      }
      // TODO otimizar para não fazer 3 consultas, talvez usando JOINs ou consultas aninhadas
      aluno.contratos = await GetContratoListService.handle({ idAluno });
      aluno.diasAulas = await GetDiaAulaListService.handle({ idAluno });
      aluno.aulas = await GetAulaListService.handle({ idAluno });
      aluno.contrato = aluno.contratos[aluno.contratos.length - 1] || null;

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
