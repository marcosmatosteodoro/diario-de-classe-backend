import { GetAlunoListService } from '../../services/aluno/getAlunoListService.js';
import { GetAulaListService } from '../../services/aula/getAulaListService.js';
import { GetContratoListService } from '../../services/contrato/getContratoListService.js';
import AbstractController from '../abstractController.js';

export class GetHomeController extends AbstractController {
  constructor(req, res) {
    super(req, res);
    this.where = {};
    this.id = req.user.sub;
  }

  async execute() {
    try {
      this.bindWhere();
      const aulasParams = { withRelations: true };
      const alunos = await GetAlunoListService.handle();
      const aulas = await GetAulaListService.handle(this.where, aulasParams);
      const contratos = await GetContratoListService.handle({ status: 'ATIVO' });
      const aulasAgendadas = aulas.filter(aula => aula.status === 'AGENDADA');

      return this.res.status(200).json({
        totalAulas: aulasAgendadas.length,
        totalAlunos: alunos.length,
        totalContratos: contratos.length,
        aulas
      });
    } catch (error) {
      return this.handleError(error, 'dashboard.home.error');
    }
  }

  bindWhere() {
    const { dataInicio, dataTermino, status, tipo, minhasAulas, professorId } = this.req.query;
    if (dataInicio) {
      const dataFim = dataTermino || dataInicio;
      this.where.dataAula = {
        gte: new Date(`${dataInicio}T00:00:00.000Z`),
        lte: new Date(`${dataFim}T23:59:59.999Z`)
      };
    }
    if (minhasAulas === 'true') {
      this.where.idProfessor = this.id;
    } else if (professorId) {
      this.where.idProfessor = professorId;
    }
    if (status) this.where.status = status;
    if (tipo) this.where.tipo = tipo;
  }

  static async handle(req, res) {
    const controller = new GetHomeController(req, res);
    await controller.execute();
  }
}
