import { GetUserService } from '../../services/user/getUserService.js';
import AbstractController from '../abstractController.js';

export class GenerateAulasByContratoController extends AbstractController {
  constructor(req, res) {
    super(req, res);
    this.where = {};
    this.initialDatas();
  }

  initialDatas() {
    const { body } = this.req;
    this.dataInicio = body.dataInicio;
    this.dataFim = body.dataFim;
    this.diasAulas = body.diasAulas;
    this.isEdit = body.isEdit === true;
    this.idProfessor = body.idProfessor;
  }

  async execute() {
    try {
      const dates = this.generateDateRangeByWeekDay(
        new Date(this.dataInicio),
        new Date(this.dataFim),
        this.diasAulas
      );

      const professor = await GetUserService.handle(this.idProfessor);
      const aulas = dates.map(dateInfo => this.aulaPrepare(dateInfo, professor));

      if (!aulas || aulas.length === 0) {
        return this.res.status(422).json({
          message: this.req.t('aulas.generate.no_classes')
        });
      }

      return this.res.status(200).json({
        count: aulas.length,
        aulas
      });
    } catch (error) {
      return this.handleError(error, 'aulas.generate.error');
    }
  }

  generateDateRangeByWeekDay(startDate, endDate, diasAulas) {
    const dates = [];
    const currentDate = new Date(startDate);

    // Mapear dias da semana para números (getDay retorna 0-6, onde 0 é domingo)
    const diasSemanaMap = {
      DOMINGO: 0,
      SEGUNDA: 1,
      TERCA: 2,
      QUARTA: 3,
      QUINTA: 4,
      SEXTA: 5,
      SABADO: 6
    };

    // Extrair os dias da semana permitidos do array de diasAulas
    const diasPermitidos = diasAulas.map(dia => diasSemanaMap[dia.diaSemana]);

    while (currentDate <= endDate) {
      const diaSemana = currentDate.getUTCDay();

      // Adicionar a data apenas se o dia da semana estiver nos dias permitidos
      if (diasPermitidos.includes(diaSemana)) {
        const diaAula = diasAulas.find(dia => diasSemanaMap[dia.diaSemana] === diaSemana);
        dates.push({
          dataAula: new Date(currentDate),
          horaInicial: diaAula.horaInicial,
          horaFinal: diaAula.horaFinal,
          duracaoAula: diaAula.duracaoAula
        });
      }

      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }

    return dates;
  }

  aulaPrepare({ dataAula, horaInicial, horaFinal, duracaoAula }, professor) {
    return {
      dataAula,
      horaInicial,
      horaFinal,
      tipo: 'PADRAO',
      duracaoAula,
      idProfessor: this.idProfessor,
      professor: {
        id: professor.id,
        nomeCompleto: professor.nomeCompleto,
        nome: professor.nome
      },
      observacao: null
    };
  }

  static async handle(req, res) {
    const controller = new GenerateAulasByContratoController(req, res);
    await controller.execute();
  }
}
