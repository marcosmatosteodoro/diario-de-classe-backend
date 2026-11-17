import { AbstractAlunoController } from './AbstractAlunoController.js';
import { GetAlunoService } from '../../services/aluno/getAlunoService.js';
import { GetAulaListService } from '../../services/aula/getAulaListService.js';
import { GetDiaAulaListService } from '../../services/diaAula/getDiaAulaListService.js';
import { GetContratoListService } from '../../services/contrato/getContratoListService.js';
import { AbstractAulaController } from '../aula/AbstractAulaController.js';
import { AbstractContratoController } from '../contrato/AbstractContratoController.js';
import { AbstractDiaAulaController } from '../diaAula/AbstractDiaAulaController.js';

export class GetAlunoController extends AbstractAlunoController {
  constructor(req, res) {
    super(req, res);
  }

  async execute() {
    try {
      const { isAdmin, id: userId } = this.req.user;
      if (!isAdmin && !userId) {
        return this.res.status(403).json({ message: this.req.t('api.errors.forbidden') });
      }

      // Usa o ID validado pelo middleware se disponível, senão usa o parâmetro original
      const idAluno = this.req.validatedId || this.req.params.id;
      const aluno = await GetAlunoService.handle(idAluno, this.where);

      if (!aluno) {
        return this.res.status(404).json({
          message: this.req.t('alunos.get.not_found')
        });
      }
      // TODO otimizar para não fazer 3 consultas, talvez usando JOINs ou consultas aninhadas
      const negocio = { idAluno };
      const comPosse = ownerWhere => (isAdmin ? negocio : { AND: [ownerWhere(userId), negocio] });
      aluno.contratos = await GetContratoListService.handle(
        comPosse(AbstractContratoController.ownerWhere)
      );
      aluno.diasAulas = await GetDiaAulaListService.handle(
        comPosse(AbstractDiaAulaController.ownerWhere)
      );
      aluno.aulas = await GetAulaListService.handle(comPosse(AbstractAulaController.ownerWhere));
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
