import { GetAlunoListService } from '../../services/aluno/getAlunoListService.js';
import { GetAulaListService } from '../../services/aula/getAulaListService.js';
import { GetContratoListService } from '../../services/contrato/getContratoListService.js';
import AbstractController from '../abstractController.js';

export class GetHomeController extends AbstractController {
  constructor(req, res) {
    super(req, res);
  }

  async execute() {
    try {
      const aulasParams = { withRelations: true };
      const aulasWhere = {
        status: { in: ['AGENDADA', 'EM_ANDAMENTO'] }
      };
      const id = this.req.user.sub;
      const alunos = await GetAlunoListService.handle();
      const aulas = await GetAulaListService.handle(aulasWhere, aulasParams);
      const contratos = await GetContratoListService.handle({ status: 'ATIVO' });
      const aulasAgendadas = aulas.filter(aula => aula.status === 'AGENDADA');
      const minhasAulas = aulas.filter(aula => aula.idProfessor === id).slice(0, 10);
      const todasAulas = aulas.slice(0, 50);

      return this.res.status(200).json({
        totalAulas: aulasAgendadas.length,
        totalAlunos: alunos.length,
        totalContratos: contratos.length,
        minhasAulas: minhasAulas || [],
        todasAsAulas: todasAulas
      });
    } catch (error) {
      return this.handleError(error, 'dashboard.home.error');
    }
  }

  static async handle(req, res) {
    const controller = new GetHomeController(req, res);
    await controller.execute();
  }
}
