import { GetAulaListService } from '../../services/aula/getAulaListService.js';
import { AbstractAulaController } from './AbstractAulaController.js';

export class GetAulaListController extends AbstractAulaController {
  constructor(req, res) {
    super(req, res);
    this.bindMainWhere();
    this.getParams();
  }

  async execute() {
    try {
      const aulas = await GetAulaListService.handle(this.where, this.params);

      if (!aulas || aulas.length === 0) {
        return this.res.status(204).json();
      }

      return this.res.status(200).json({
        count: aulas.length,
        data: aulas
      });
    } catch (error) {
      return this.handleError(error, 'aulas.list.error');
    }
  }

  bindMainWhere() {
    const { dataInicio, dataTermino, aluno, professor, tipo, status, q } = this.req.query;

    if (dataInicio) {
      const dataFim = dataTermino || dataInicio;
      this.where.dataAula = {
        gte: new Date(`${dataInicio}T00:00:00.000Z`),
        lte: new Date(`${dataFim}T23:59:59.999Z`)
      };
    }
    if (tipo) {
      this.where.tipo = tipo;
    }

    if (status) {
      this.where.status = status;
    }

    if (aluno) {
      this.where.aluno = {
        nome: {
          contains: aluno,
          mode: 'insensitive'
        }
      };
    }

    if (professor) {
      this.where.professor = {
        nome: {
          contains: professor,
          mode: 'insensitive'
        }
      };
    }

    if (q) {
      this.where.OR = [
        {
          aluno: {
            nome: {
              contains: q,
              mode: 'insensitive'
            }
          }
        },
        {
          professor: {
            nome: {
              contains: q,
              mode: 'insensitive'
            }
          }
        }
      ];
    }
  }

  getParams() {
    const onlyName = {
      select: {
        nome: true
      }
    };

    const select = {
      id: true,
      idAluno: false,
      idProfessor: false,
      idContrato: false,
      dataAula: true,
      horaInicial: true,
      horaFinal: true,
      tipo: true,
      status: true,
      duracaoAula: false,
      observacao: false,
      aluno: onlyName,
      professor: onlyName,
      contrato: false,
      dataCriacao: false,
      dataAtualizacao: false
    };

    this.params = { select };
  }

  static async handle(req, res) {
    const controller = new GetAulaListController(req, res);
    return await controller.execute();
  }
}
