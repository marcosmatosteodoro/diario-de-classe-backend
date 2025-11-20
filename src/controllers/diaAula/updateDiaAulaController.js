import AbstractController from '../abstractController.js';
import { GetDiaAulaService } from '../../services/diaAula/getDiaAulaService.js';
import { UpdateDiaAulaService } from '../../services/diaAula/updateDiaAulaService.js';
import { IsDiaAulaContratoDiaDaSemanaExistsService } from '../../services/diaAula/isDiaAulaContratoDiaDaSemanaExistsService.js';
import { GetConfiguracaoService } from '../../services/configuracao/getConfiguracaoService.js';

export class UpdateDiaAulaController extends AbstractController {
  constructor(req, res) {
    super(req, res);
    this.horaDeFim = null;
  }

  async execute() {
    try {
      const id = this.req.validatedId || this.req.params.id;
      const diaAula = await GetDiaAulaService.handle(id);

      if (!diaAula) {
        return this.res.status(404).json({
          message: this.req.t('diaAulas.get.not_found')
        });
      }

      if (
        diaAula.idAluno !== this.req.body.idAluno ||
        diaAula.idContrato !== this.req.body.idContrato
      ) {
        return this.res.status(409).json({
          message: this.req.t('diaAulas.create.you_cannot_change_aluno_contrato')
        });
      }

      if (diaAula.diaDaSemana !== this.req.body.diaDaSemana) {
        const isDiaAulaContratoDiaDaSemanaExists =
          await IsDiaAulaContratoDiaDaSemanaExistsService.handle({
            idAluno: this.req.body.idAluno,
            idContrato: this.req.body.idContrato,
            diaDaSemana: this.req.body.diaDaSemana
          });

        if (isDiaAulaContratoDiaDaSemanaExists) {
          return this.res.status(422).json({
            message: this.req.t('diaAulas.create.aluno_contrato_dia_aula_exists')
          });
        }
      }

      if (
        diaAula.horaDeInicio !== this.req.body.horaDeInicio ||
        diaAula.quantidadeDeAulas !== this.req.body.quantidadeDeAulas
      ) {
        const duracaoDaAula = await this.getDuracaoDaAula();
        this.horaDeFim = this.getHoraDeFim({
          duracaoDaAula,
          horaDeInicio: this.req.body.horaDeInicio,
          quantidadeDeAulas: this.req.body.quantidadeDeAulas
        });
      } else {
        this.horaDeFim = diaAula.horaDeFim;
      }

      const data = {
        ...this.req.body,
        horaDeFim: this.horaDeFim
      };

      const updatedDiaAula = await UpdateDiaAulaService.handle(id, data);

      return this.res.status(200).json(updatedDiaAula);
    } catch (error) {
      return this.handleError(error, 'diaAulas.update.error');
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
    const controller = new UpdateDiaAulaController(req, res);
    await controller.execute();
  }
}
