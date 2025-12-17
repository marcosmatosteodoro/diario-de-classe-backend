import AbstractController from '../abstractController.js';
import { CreateDiaAulaService } from '../../services/diaAula/createDiaAulaService.js';
import { GetConfiguracaoService } from '../../services/configuracao/getConfiguracaoService.js';
import { GetAlunoService } from '../../services/aluno/getAlunoService.js';
import { GetContratoService } from '../../services/contrato/getContratoService.js';
import { GetDiaAulaListService } from '../../services/diaAula/getDiaAulaListService.js';
import { UpdateDiaAulaService } from '../../services/diaAula/updateDiaAulaService.js';
import { DeleteDiaAulaService } from '../../services/diaAula/deleteDiaAulaService.js';

export class CreateManyDiaAulaController extends AbstractController {
  constructor(req, res) {
    super(req, res);
    this.diasSemanas = ['SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO', 'DOMINGO'];
    this.diasAulasData = [];
    this.data = [];
  }

  async execute() {
    try {
      const idContrato = this.req.validatedId || this.req.params.id;
      const idAluno = this.req.body.idAluno;
      const isAlunoExists = await this.isAlunoExists(this.req.body.idAluno);
      const isContratoExists = await this.isContratoExists(this.req.body.idContrato);
      const checkIfAllDaysOfWeekAreAvailable = this.checkIfAllDaysOfWeekAreAvailable(this.req.body);
      const contratoDiasAulas = await GetDiaAulaListService.handle({ idContrato });
      const duracaoAula = await this.getDuracaoDaAula();

      if (!isAlunoExists) {
        return this.res.status(422).json({
          message: this.req.t('diaAulas.error.aluno_not_exists')
        });
      }

      if (!isContratoExists) {
        return this.res.status(422).json({
          message: this.req.t('diaAulas.error.contrato_not_exists')
        });
      }

      if (!checkIfAllDaysOfWeekAreAvailable) {
        return this.res.status(422).json({
          message: this.req.t('diaAulas.error.days_of_week_not_provided')
        });
      }

      this.data = this.prepareDiasAulasData({
        body: this.req.body,
        idAluno,
        idContrato,
        duracaoAula
      });

      this.data = await Promise.all(
        this.data.map(async row => {
          const rowExists = contratoDiasAulas?.find(diaAula => diaAula.diaSemana === row.diaSemana);
          // create
          if (!rowExists && this.req.body[row.diaSemana].ativo === true)
            return await CreateDiaAulaService.handle(row);
          // update
          if (rowExists && this.req.body[row.diaSemana].ativo === true)
            return await UpdateDiaAulaService.handle(rowExists.id, row);
          // delete
          if (rowExists && this.req.body[row.diaSemana].ativo === false)
            await DeleteDiaAulaService.handle(rowExists.id);
          return null;
        })
      );

      this.data = this.data.filter(row => row !== null);

      return this.res.status(201).json(this.data);
    } catch (error) {
      return this.handleError(error, 'diaAulas.create.error');
    }
  }

  checkIfAllDaysOfWeekAreAvailable(body) {
    return this.diasSemanas.every(diaSemana => body[diaSemana]);
  }

  async isAlunoExists(id) {
    const aluno = await GetAlunoService.handle(id);
    return !!aluno;
  }

  async isContratoExists(id) {
    const contrato = await GetContratoService.handle(id);
    return !!contrato;
  }

  prepareDiasAulasData({ body, idAluno, idContrato, duracaoAula }) {
    return this.diasSemanas.map(diaSemana => {
      const data = body[diaSemana];
      const hotaFimCalculada = this.getHoraDeFim({
        duracaoAula,
        horaInicial: data.horaInicial,
        quantidadeAulas: data.quantidadeAulas
      });
      return {
        idAluno,
        idContrato,
        diaSemana,
        quantidadeAulas: data.quantidadeAulas,
        horaInicial: data.horaInicial,
        horaFinal: hotaFimCalculada
      };
    });
  }

  async getDuracaoDaAula() {
    const configuracoes = await GetConfiguracaoService.handle();

    if (!configuracoes || configuracoes.length === 0) {
      throw new Error('Nenhuma configuração encontrada para determinar a duração da aula.');
    }

    return configuracoes[0].duracaoAula;
  }

  getHoraDeFim({ duracaoAula, horaInicial, quantidadeAulas }) {
    const [hours, minutes] = horaInicial.split(':').map(Number);
    const totalMinutesToAdd = duracaoAula * quantidadeAulas;

    let endHours = hours + Math.floor((minutes + totalMinutesToAdd) / 60);
    const endMinutes = (minutes + totalMinutesToAdd) % 60;

    // Ajusta para formato 24 horas
    endHours = endHours % 24;

    // Formata para HH:MM
    const formattedEndHours = String(endHours).padStart(2, '0');
    const formattedEndMinutes = String(endMinutes).padStart(2, '0');

    return `${formattedEndHours}:${formattedEndMinutes}`;
  }

  static async handle(req, res) {
    const controller = new CreateManyDiaAulaController(req, res);
    await controller.execute();
  }
}
