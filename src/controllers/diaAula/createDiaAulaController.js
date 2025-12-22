import AbstractController from '../abstractController.js';
import { CreateDiaAulaService } from '../../services/diaAula/createDiaAulaService.js';
import { IsDiaAulaAlunoContratoExistsService } from '../../services/diaAula/isDiaAulaAlunoContratoExistsService.js';
import { GetConfiguracaoService } from '../../services/configuracao/getConfiguracaoService.js';
import { IsDiaAulaContratoDiaDaSemanaExistsService } from '../../services/diaAula/isDiaAulaContratoDiaDaSemanaExistsService.js';
import { GetAlunoService } from '../../services/aluno/getAlunoService.js';
import { GetContratoService } from '../../services/contrato/getContratoService.js';

export class CreateDiaAulaController extends AbstractController {
  constructor(req, res) {
    super(req, res);
  }

  async execute() {
    try {
      const isAlunoExists = await this.isAlunoExists(this.req.body.idAluno);
      if (!isAlunoExists) {
        return this.res.status(422).json({
          message: this.req.t('diaAulas.error.aluno_not_exists')
        });
      }

      const isContratoExists = await this.isContratoExists(this.req.body.idContrato);
      if (!isContratoExists) {
        return this.res.status(422).json({
          message: this.req.t('diaAulas.error.contrato_not_exists')
        });
      }

      const isDiaAulaAlunoContratoExists = await this.isDiaAulaAlunoContratoExists();
      const isDiaAulaContratoDiaDaSemanaExists = await this.isDiaAulaContratoDiaDaSemanaExists();

      if (isDiaAulaAlunoContratoExists && isDiaAulaContratoDiaDaSemanaExists) {
        return this.res.status(422).json({
          message: this.req.t('diaAulas.create.aluno_contrato_dia_aula_exists')
        });
      }

      const duracaoAula = await this.getDuracaoDaAula();
      const hotaFimCalculada = this.getHoraDeFim({
        duracaoAula,
        horaInicial: this.req.body.horaInicial,
        quantidadeAulas: this.req.body.quantidadeAulas
      });

      const data = {
        ...this.req.body,
        horaFinal: hotaFimCalculada
      };

      const newDiaAula = await CreateDiaAulaService.handle(data);

      return this.res.status(201).json(newDiaAula);
    } catch (error) {
      return this.handleError(error, 'diaAulas.create.error');
    }
  }

  async isAlunoExists(id) {
    const aluno = await GetAlunoService.handle(id);
    return !!aluno;
  }

  async isContratoExists(id) {
    const contrato = await GetContratoService.handle(id);
    return !!contrato;
  }

  async isDiaAulaAlunoContratoExists() {
    return await IsDiaAulaAlunoContratoExistsService.handle({
      idAluno: this.req.body.idAluno,
      idContrato: this.req.body.idContrato
    });
  }
  async isDiaAulaContratoDiaDaSemanaExists() {
    return await IsDiaAulaContratoDiaDaSemanaExistsService.handle({
      idAluno: this.req.body.idAluno,
      idContrato: this.req.body.idContrato,
      diaSemana: this.req.body.diaSemana
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
    const controller = new CreateDiaAulaController(req, res);
    await controller.execute();
  }
}
