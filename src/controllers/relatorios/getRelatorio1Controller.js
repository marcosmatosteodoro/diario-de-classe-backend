import { GetAlunoListService } from '../../services/aluno/getAlunoListService.js';
import { generateExcel } from '../../utilities/generateExcel.js';
import AbstractController from '../abstractController.js';

/**
 * Gera o Excel de "Frequência dos alunos por período" (`GET
 * /relatorios/relatorio-1`, atrás de `isLoggedIn` + `adminOnly` +
 * `validateRelatorio1`) — não tem repository nem service próprio.
 *
 * O catálogo (`GetRelatoriosController`) anuncia filtros de
 * `dataInicial`/`dataFinal`/`aluno`/`professor` para este relatório; este
 * controller lê os equivalentes em query (`dataInicial`/`dataFinal`/
 * `idAluno`/`idProfessor`) e restringe `GetAlunoListService` de acordo (ver
 * `buildWhere`). O Excel gerado projeta apenas `id`/`nome` — não há coluna
 * de frequência (escopo maior, fora desta correção).
 */
export class GetRelatorio1Controller extends AbstractController {
  constructor(req, res) {
    super(req, res);
  }

  /**
   * Monta o `where` de `GetAlunoListService` a partir dos filtros anunciados
   * pelo catálogo (`dataInicial`/`dataFinal`/`idAluno`/`idProfessor`).
   * - `idAluno` restringe ao aluno exato.
   * - `idProfessor`/`dataInicial`/`dataFinal` restringem a alunos com ao
   *   menos uma aula batendo os critérios, via `aulas.some`.
   * - Sem nenhum filtro, retorna `{}` (mantém o comportamento de trazer
   *   todos os alunos).
   * @param {Object} query - `req.query`
   * @returns {Object} where do Prisma para `GetAlunoListService.handle`
   */
  buildWhere({ dataInicial, dataFinal, idAluno, idProfessor } = {}) {
    const where = {};

    if (idAluno) {
      where.id = idAluno;
    }

    const aulaFiltro = {};
    if (idProfessor) {
      aulaFiltro.idProfessor = idProfessor;
    }
    if (dataInicial || dataFinal) {
      aulaFiltro.dataAula = {};
      if (dataInicial) aulaFiltro.dataAula.gte = new Date(dataInicial);
      if (dataFinal) aulaFiltro.dataAula.lte = new Date(dataFinal);
    }
    if (Object.keys(aulaFiltro).length > 0) {
      where.aulas = { some: aulaFiltro };
    }

    return where;
  }

  /**
   * @returns {Promise<void>} responde 200 com o buffer do Excel (`.xlsx`),
   *   planilha "Alunos" com as colunas `id`/`nome`, restrita pelos filtros
   *   de `dataInicial`/`dataFinal`/`idAluno`/`idProfessor` recebidos via query
   */
  async execute() {
    try {
      const filename = 'Relatório 1 - Alunos';
      const where = this.buildWhere(this.req.query);
      const alunos = await GetAlunoListService.handle(where);
      // Seleciona apenas id e nome
      const data = alunos.map(aluno => ({ id: aluno.id, nome: aluno.nome }));

      const excelBuffer = generateExcel({ res: this.res, filename, data, sheetName: 'Alunos' });
      return this.res.status(200).send(excelBuffer);
    } catch (error) {
      return this.handleError(error, 'configuracaos.list.error');
    }
  }

  static async handle(req, res) {
    const controller = new GetRelatorio1Controller(req, res);
    await controller.execute();
  }
}
