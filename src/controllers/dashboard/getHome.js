import { GetAlunoListService } from '../../services/aluno/getAlunoListService.js';
import { GetAulaListService } from '../../services/aula/getAulaListService.js';
import { GetContratoListService } from '../../services/contrato/getContratoListService.js';
import AbstractController from '../abstractController.js';

/**
 * Monta os números e a lista de aulas da tela inicial do dashboard
 * (`GET /dashboard`, atrás de `isLoggedIn`).
 *
 * Orquestra três services já documentados na própria camada de aluno, aula e
 * contrato — não tem repository nem service próprio:
 * - `GetAlunoListService` e `GetContratoListService`: contam alunos e
 *   contratos ATIVO visíveis ao usuário logado (todos, se admin).
 * - `GetAulaListService`: traz as aulas conforme os filtros de
 *   `req.query` (ver `bindMainWhere`), com relações (`withRelations: true`).
 *
 * Nenhuma das três listas é paginada nem filtrada por data no banco por
 * padrão — o custo cresce com o histórico total, não com "hoje". Em
 * seguida, `aulasAgendadas` é obtido filtrando o array de aulas já trazido
 * **em memória** (`aulas.filter(...)`), em vez de um `WHERE`/`COUNT` no
 * banco.
 *
 * Query aceitos em `req.query` (todos opcionais): `dataInicio`,
 * `dataTermino` (janela de `dataAula`), `status`, `tipo`, `alunoId`,
 * `professorId`, `minhasAulas` ('true' força o professor logado). Usuário
 * não-admin sempre tem o `where` de aulas/alunos/contratos restrito ao
 * próprio id, ignorando `professorId`/`minhasAulas` informados.
 */
export class GetHomeController extends AbstractController {
  constructor(req, res) {
    super(req, res);
    this.where = {};
    this.alunoWhere = {};
    this.contratoWhere = {};
    this.id = req.user.sub;
  }

  /**
   * @returns {Promise<void>} responde 200 com
   *   `{ totalAulas, totalAlunos, totalContratos, aulas }`, onde `totalAulas`
   *   conta só as aulas com `status === 'AGENDADA'` dentro do conjunto já
   *   filtrado por `where` (não é um COUNT à parte).
   */
  async execute() {
    try {
      this.bindWheres();
      const aulasParams = { withRelations: true };
      const alunos = await GetAlunoListService.handle(this.alunoWhere);
      const aulas = await GetAulaListService.handle(this.where, aulasParams);
      const contratos = await GetContratoListService.handle(this.contratoWhere);
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

  bindWheres() {
    this.bindContratoWhere();
    this.bindAlunoWhere();
    this.bindMainWhere();
  }

  bindContratoWhere() {
    this.contratoWhere = { status: 'ATIVO' };

    if (!this.req.user.isAdmin) {
      this.contratoWhere.aulas = {
        some: {
          idProfessor: this.req.user.id
        }
      };
    }
  }

  bindAlunoWhere() {
    if (!this.req.user.isAdmin) {
      this.alunoWhere = {
        OR: [
          {
            aulas: {
              some: {
                idProfessor: this.req.user.id
              }
            }
          },
          {
            criador: this.req.user.id
          }
        ]
      };
    }
  }

  bindMainWhere() {
    const { dataInicio, dataTermino, status, tipo, minhasAulas, professorId, alunoId } =
      this.req.query;

    if (dataInicio) {
      const dataFim = dataTermino || dataInicio;
      this.where.dataAula = {
        gte: new Date(`${dataInicio}T00:00:00.000Z`),
        lte: new Date(`${dataFim}T23:59:59.999Z`)
      };
    }

    if (status) {
      this.where.status = status;
    }

    if (tipo) {
      this.where.tipo = tipo;
    }

    if (alunoId) {
      this.where.idAluno = alunoId;
    }

    if (!this.req.user.isAdmin) {
      this.where.idProfessor = this.req.user.id;
    } else if (minhasAulas === 'true') {
      this.where.idProfessor = this.id;
    } else if (professorId) {
      this.where.idProfessor = professorId;
    }
  }

  static async handle(req, res) {
    const controller = new GetHomeController(req, res);
    await controller.execute();
  }
}
