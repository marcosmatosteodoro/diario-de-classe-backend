import AbstractController from '../abstractController.js';
import { GetDiaAulaService } from '../../services/diaAula/getDiaAulaService.js';
import { UpdateDiaAulaService } from '../../services/diaAula/updateDiaAulaService.js';
import { IsDiaAulaContratoDiaDaSemanaExistsService } from '../../services/diaAula/isDiaAulaContratoDiaDaSemanaExistsService.js';
import { GetConfiguracaoService } from '../../services/configuracao/getConfiguracaoService.js';

export class UpdateDiaAulaController extends AbstractController {
  constructor(req, res) {
    super(req, res);
    this.horaFinal = null;
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
        (!!this.req.body.idAluno && diaAula.idAluno !== this.req.body.idAluno) ||
        (!!this.req.body.idContrato && diaAula.idContrato !== this.req.body.idContrato)
      ) {
        return this.res.status(422).json({
          message: this.req.t('diaAulas.create.you_cannot_change_aluno_contrato')
        });
      }

      if (diaAula.diaSemana !== this.req.body.diaSemana) {
        const isDiaAulaContratoDiaDaSemanaExists =
          await IsDiaAulaContratoDiaDaSemanaExistsService.handle({
            idAluno: this.req.body.idAluno,
            idContrato: this.req.body.idContrato,
            diaSemana: this.req.body.diaSemana
          });

        if (isDiaAulaContratoDiaDaSemanaExists) {
          return this.res.status(422).json({
            message: this.req.t('diaAulas.create.aluno_contrato_dia_aula_exists')
          });
        }
      }

      if (
        diaAula.horaInicial !== this.req.body.horaInicial ||
        diaAula.quantidadeAulas !== this.req.body.quantidadeAulas
      ) {
        const duracaoAula = await this.getDuracaoDaAula();
        this.horaFinal = this.getHoraDeFim({
          duracaoAula,
          horaInicial: this.req.body.horaInicial,
          quantidadeAulas: this.req.body.quantidadeAulas
        });
      } else {
        this.horaFinal = diaAula.horaFinal;
      }

      const data = {
        ...this.req.body,
        horaFinal: this.horaFinal
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
    const controller = new UpdateDiaAulaController(req, res);
    await controller.execute();
  }
}
