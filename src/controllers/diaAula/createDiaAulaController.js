import AbstractController from '../abstractController.js';
import { CreateDiaAulaService } from '../../services/diaAula/createDiaAulaService.js';
import { IsDiaAulaAlunoContratoExistsService } from '../../services/diaAula/isDiaAulaAlunoContratoExistsService.js';
import { GetConfiguracaoService } from '../../services/configuracao/getConfiguracaoService.js';
import { IsDiaAulaContratoDiaDaSemanaExistsService } from '../../services/diaAula/isDiaAulaContratoDiaDaSemanaExistsService.js';

export class CreateDiaAulaController extends AbstractController {
  constructor(req, res) {
    super(req, res);
  }

  async execute() {
    try {
      const isDiaAulaAlunoContratoExists = await IsDiaAulaAlunoContratoExistsService.handle({
        idAluno: this.req.body.idAluno,
        idContrato: this.req.body.idContrato
      });

      const isDiaAulaContratoDiaDaSemanaExists =
        await IsDiaAulaContratoDiaDaSemanaExistsService.handle({
          idAluno: this.req.body.idAluno,
          idContrato: this.req.body.idContrato,
          diaDaSemana: this.req.body.diaDaSemana
        });

      if (isDiaAulaAlunoContratoExists && isDiaAulaContratoDiaDaSemanaExists) {
        return this.res.status(409).json({
          message: this.req.t('diaAulas.create.aluno_contrato_dia_aula_exists')
        });
      }

      const duracaoDaAula = await this.getDuracaoDaAula();
      const hotaFimCalculada = this.getHoraDeFim({
        duracaoDaAula,
        horaDeInicio: this.req.body.horaDeInicio,
        quantidadeDeAulas: this.req.body.quantidadeDeAulas
      });

      const data = {
        ...this.req.body,
        horaDeFim: hotaFimCalculada
      };

      const newDiaAula = await CreateDiaAulaService.handle(data);

      return this.res.status(201).json(newDiaAula);
    } catch (error) {
      return this.handleError(error, 'diaAulas.create.error');
    }
  }

  async getDuracaoDaAula() {
    const configuracoes = await GetConfiguracaoService.handle();

    if (!configuracoes || configuracoes.length === 0) {
      throw new Error('Nenhuma configuração encontrada para determinar a duração da aula.');
    }

    return configuracoes[0].duracaoDaAula;
  }

  getHoraDeFim({ duracaoDaAula, horaDeInicio, quantidadeDeAulas }) {
    const [hours, minutes] = horaDeInicio.split(':').map(Number);
    const totalMinutesToAdd = duracaoDaAula * quantidadeDeAulas;

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
