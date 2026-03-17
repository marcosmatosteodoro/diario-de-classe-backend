import AbstractController from '../abstractController.js';
import { GetAlunoService } from '../../services/aluno/getAlunoService.js';
import { GetUserService } from '../../services/user/getUserService.js';
import { GetConfiguracaoService } from '../../services/configuracao/getConfiguracaoService.js';
import { GetDiaAulaListService } from '../../services/diaAula/getDiaAulaListService.js';
import { CreateDiaAulaService } from '../../services/diaAula/createDiaAulaService.js';
import { UpdateDiaAulaService } from '../../services/diaAula/updateDiaAulaService.js';
import { DeleteDiaAulaService } from '../../services/diaAula/deleteDiaAulaService.js';
import { GetAulaListService } from '../../services/aula/getAulaListService.js';
import { CreateAulaService } from '../../services/aula/createAulaService.js';
import { UpdateAulaService } from '../../services/aula/updateAulaService.js';
import { DeleteAulaService } from '../../services/aula/deleteAulaService.js';
import { GetContratoService } from '../../services/contrato/getContratoService.js';
import { UpdateContratoService } from '../../services/contrato/updateContratoService.js';
import { UpdateAulasContratoService } from '../../services/contrato/updateAulasContratoService.js';

export class UpdateContratoController extends AbstractController {
  constructor(req, res) {
    super(req, res);
    this.idAluno = req.body.idAluno;
    this.idProfessor = req.body.idProfessor;
    this.diasSemanas = ['SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO', 'DOMINGO'];
    this.diasAulas = [];
    this.aulas = [];
  }

  async execute() {
    try {
      const id = this.req.validatedId || this.req.params.id;
      const contrato = await GetContratoService.handle(id);
      const aluno = await GetAlunoService.handle(this.idAluno);
      const professor = await GetUserService.handle(this.idProfessor);

      if (!contrato) {
        return this.res.status(404).json({
          message: this.req.t('contratos.get.not_found')
        });
      }

      if (!aluno) {
        return this.res.status(404).json({
          message: this.req.t('alunos.get.not_found')
        });
      }

      if (!professor) {
        return this.res.status(404).json({
          message: this.req.t('professor.get.not_found')
        });
      }

      if (!this.checkIfAllDaysOfWeekAreAvailable(this.req.body)) {
        return this.res.status(422).json({
          message: this.req.t('diaAulas.error.days_of_week_not_provided')
        });
      }

      await this.updateContrato(id);
      await this.createDiasAulas();
      await this.createAulas();
      await UpdateAulasContratoService.handle(id);

      const data = {
        ...this.contrato,
        diasAulas: this.diasAulas,
        aulas: this.aulas
      };

      return this.res.status(201).json(data);
    } catch (error) {
      return this.handleError(error, 'contratos.update.error');
    }
  }

  async updateContrato(id) {
    const body = this.req.body;
    const dataContrato = {
      idAluno: this.idAluno,
      dataInicio: new Date(body.dataInicio),
      dataTermino: new Date(body.dataTermino),
      idioma: body.idioma,
      status: body.status || 'ATIVO'
    };

    this.contrato = await UpdateContratoService.handle(id, dataContrato);
  }

  async createDiasAulas() {
    const body = this.req.body;
    const idContrato = this.contrato.id;
    const idAluno = this.idAluno;
    const contratoDiasAulas = await GetDiaAulaListService.handle({ idContrato });
    const duracaoAula = await this.getDuracaoDaAula();
    let dataDiasAulas = this.prepareDiasAulasData({ body, idAluno, idContrato, duracaoAula });

    dataDiasAulas = await Promise.all(
      dataDiasAulas.map(async row => {
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

    this.diasAulas = dataDiasAulas.filter(row => row !== null);
  }

  async createAulas() {
    const idContrato = this.contrato.id;
    const idAluno = this.idAluno;
    const idProfessor = this.idProfessor;
    const aulas = this.req.body.aulas;
    const aulasExisted = await GetAulaListService.handle({ idContrato, idAluno, idProfessor });

    // Delete // Update
    await Promise.all(
      aulasExisted.map(async aulaEx => {
        const aulaExisted = aulas.find(aula => aula.dataAula === aulaEx.dataAula);
        const isAulaStillExists = aulaExisted || null;
        if (!isAulaStillExists) {
          await DeleteAulaService.handle(aulaEx.id);
        } else {
          const data = this.aulaPrepareData({
            idAluno,
            idProfessor,
            idContrato,
            aula: aulaExisted
          });
          const result = await UpdateAulaService.handle({
            id: aulaEx.id,
            ...data
          });

          this.aulas.push(result);
        }
      })
    );

    // Create
    await Promise.all(
      aulas.map(async aula => {
        const isAulaExist = aulasExisted.find(aulaEx => aulaEx.dataAula === aula.dataAula);
        if (!isAulaExist) {
          const data = this.aulaPrepareData({
            idAluno,
            idProfessor,
            idContrato,
            aula
          });
          const result = await CreateAulaService.handle(data);

          this.aulas.push(result);
        }
      })
    );

    this.sortAulasByDate();
  }

  checkIfAllDaysOfWeekAreAvailable(body) {
    return this.diasSemanas.every(diaSemana => body[diaSemana]);
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
        quantidadeAulas: parseInt(data.quantidadeAulas, 10),
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

  aulaPrepareData({ idAluno, idProfessor, idContrato, aula }) {
    return {
      idAluno,
      idProfessor,
      idContrato,
      dataAula: aula.dataAula,
      horaInicial: aula.horaInicial,
      horaFinal: aula.horaFinal,
      tipo: aula.tipo,
      status: aula.status || 'AGENDADA',
      observacao: aula.observacao
    };
  }

  sortAulasByDate() {
    return this.aulas.sort((a, b) => new Date(a.dataAula) - new Date(b.dataAula));
  }

  static async handle(req, res) {
    const controller = new UpdateContratoController(req, res);
    await controller.execute();
  }
}
