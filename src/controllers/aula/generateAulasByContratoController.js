import AbstractController from '../abstractController.js';

export class GenerateAulasByContratoController extends AbstractController {
  constructor(req, res) {
    super(req, res);
    this.where = {};
  }

  async execute() {
    try {
      const dataInicio = this.req.body.dataInicio;
      const dataFim = this.req.body.dataFim;
      const diasAulas = this.req.body.diasAulas;

      const dates = this.generateDateRangeByWeekDay(
        new Date(dataInicio),
        new Date(dataFim),
        diasAulas
      );

      const aulas = dates.map(dateInfo => this.aulaPrepare(dateInfo));

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
      const diaSemana = currentDate.getDay();

      // Adicionar a data apenas se o dia da semana estiver nos dias permitidos
      if (diasPermitidos.includes(diaSemana)) {
        const diaAula = diasAulas.find(dia => diasSemanaMap[dia.diaSemana] === diaSemana);
        dates.push({
          dataAula: new Date(currentDate),
          horaInicial: diaAula.horaInicial,
          horaFinal: diaAula.horaFinal
        });
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
  }

  aulaPrepare({ dataAula, horaInicial, horaFinal }) {
    return {
      dataAula,
      horaInicial,
      horaFinal,
      tipo: 'PADRAO',
      observacao: null
    };
  }

  static async handle(req, res) {
    const controller = new GenerateAulasByContratoController(req, res);
    await controller.execute();
  }
}
