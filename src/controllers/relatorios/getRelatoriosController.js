import { GetAlunoListService } from '../../services/aluno/getAlunoListService.js';
import { GetAulaListService } from '../../services/aula/getAulaListService.js';
import { GetContratoListService } from '../../services/contrato/getContratoListService.js';
import { GetUserListService } from '../../services/user/getUserListService.js';
import AbstractController from '../abstractController.js';

/**
 * Monta o catálogo de relatórios disponíveis (`GET /relatorios`, atrás de
 * `isLoggedIn` + `adminOnly`) — não tem repository nem service próprio.
 *
 * Não recebe query/params: as opções de filtro (professor, aluno, aula,
 * contrato) são montadas buscando a lista **inteira** de cada entidade em
 * paralelo (`Promise.all`), sem filtro nenhum, só para popular dropdown.
 *
 * `getAulasOptions` lê `aula.nome` para o `label` de cada opção; esse campo
 * não existe em `Aula` (ver schema Prisma), então o label de aula fica
 * sempre vazio/undefined no dropdown.
 *
 * Hoje o catálogo devolve um único relatório fixo, `relatorio-1`, com os
 * filtros `dataInicial`/`dataFinal`/`idAluno`/`idProfessor` anunciados no
 * `filters`; esses filtros são aplicados por `GetRelatorio1Controller.buildWhere`.
 */
export class GetRelatoriosController extends AbstractController {
  constructor(req, res) {
    super(req, res);
    this.professoresOptions = [];
    this.alunosOptions = [];
    this.aulasOptions = [];
    this.contratosOptions = [];
  }

  async getProfessoresOptions() {
    const professores = await GetUserListService.handle();
    this.professoresOptions = professores.map(professor => ({
      value: professor.id,
      label: professor.nome,
      data: professor
    }));
  }

  async getAlunosOptions() {
    const alunos = await GetAlunoListService.handle();
    this.alunosOptions = alunos.map(aluno => ({
      value: aluno.id,
      label: aluno.nome,
      data: aluno
    }));
  }

  async getAulasOptions() {
    const aulas = await GetAulaListService.handle();
    this.aulasOptions = aulas.map(aula => ({
      value: aula.id,
      label: aula.nome,
      data: aula
    }));
  }

  async getContratosOptions() {
    const contratos = await GetContratoListService.handle();
    this.contratosOptions = contratos.map(contrato => ({
      value: contrato.id,
      label: contrato.nome,
      data: contrato
    }));
  }

  buildFilter(filter) {
    switch (filter) {
      case 'dataInicial':
        return {
          required: false,
          htmlFor: 'dataInicial',
          label: 'Data Inicial',
          placeholder: 'Selecione a data inicial',
          type: 'date'
        };
      case 'dataFinal':
        return {
          required: false,
          htmlFor: 'dataFinal',
          label: 'Data Final',
          placeholder: 'Selecione a data final',
          type: 'date'
        };
      case 'professor':
        return {
          required: false,
          htmlFor: 'idProfessor',
          label: 'Professor',
          placeholder: 'Selecione o professor',
          type: 'select',
          options: this.professoresOptions
        };
      case 'aluno':
        return {
          required: false,
          htmlFor: 'idAluno',
          label: 'Aluno',
          placeholder: 'Selecione o aluno',
          type: 'select',
          options: this.alunosOptions
        };
      case 'aula':
        return {
          required: false,
          htmlFor: 'idAula',
          label: 'Aula',
          placeholder: 'Selecione a aula',
          type: 'select',
          options: this.aulasOptions
        };
      case 'contrato':
        return {
          required: false,
          htmlFor: 'idContrato',
          label: 'Contrato',
          placeholder: 'Selecione o contrato',
          type: 'select',
          options: this.contratosOptions
        };
      default:
        return null;
    }
  }

  buildFiltersToRelatorio(filters) {
    return filters.map(filter => this.buildFilter(filter)).filter(filter => filter !== null);
  }

  /**
   * @returns {Promise<void>} responde 200 com um array de relatórios
   *   `{ endpoint, title, description, filters }`, onde `filters` é a lista
   *   de objetos de UI (`buildFilter`) para os filtros anunciados por cada
   *   relatório.
   */
  async execute() {
    try {
      await Promise.all([
        this.getProfessoresOptions(),
        this.getAlunosOptions(),
        this.getAulasOptions(),
        this.getContratosOptions()
      ]);

      const relatorios = [
        {
          endpoint: 'relatorio-1',
          title: 'Frequência dos alunos por periodo',
          description:
            'Esse relatório mostra a frequência dos alunos por período, permitindo identificar quais alunos estão tendo mais ou menos frequência nas aulas.',
          filters: this.buildFiltersToRelatorio(['dataInicial', 'dataFinal', 'aluno', 'professor'])
        }
      ];

      return this.res.status(200).json(relatorios);
    } catch (error) {
      return this.handleError(error, 'relatorios.list.error');
    }
  }

  static async handle(req, res) {
    const controller = new GetRelatoriosController(req, res);
    await controller.execute();
  }
}
