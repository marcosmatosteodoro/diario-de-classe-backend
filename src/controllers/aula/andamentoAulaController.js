import AbstractController from '../abstractController.js';
import { GetAulaService } from '../../services/aula/getAulaService.js';
import { UpdateAulaService } from '../../services/aula/updateAulaService.js';

export class AndamentoAulaController extends AbstractController {
  constructor(req, res) {
    super(req, res);
  }

  async execute() {
    try {
      const id = this.req.validatedId || this.req.params.id;
      const aula = await GetAulaService.handle(id);
      const newStatus = this.req.body.status;

      if (!newStatus) {
        return this.res.status(400).json({
          message: this.req.t('aulas.andamento.status_required')
        });
      }

      if (!aula) {
        return this.res.status(404).json({
          message: this.req.t('aulas.get.not_found')
        });
      }

      const currentStatus = aula.status;

      if (newStatus === currentStatus) {
        return this.res.status(200).json(aula);
      }

      const statusValidation = this.validateStatusTransition(currentStatus, newStatus);

      if (!statusValidation) {
        return this.res.status(422).json({
          message: this.req.t('aulas.andamento.invalid_status_transition', {
            currentStatus,
            newStatus
          })
        });
      }

      const updatedAula = await UpdateAulaService.handle(id, { status: newStatus });

      return this.res.status(200).json(updatedAula);
    } catch (error) {
      return this.handleError(error, 'aulas.update.error');
    }
  }

  validateStatusTransition(currentStatus, newStatus) {
    const statusAula = ['EM_ANDAMENTO', 'CANCELADA', 'CANCELADA_POR_FALTA', 'CONCLUIDA'];
    const statusAulaFinal = ['CONCLUIDA', 'CANCELADA', 'CANCELADA_POR_FALTA'];

    if (!statusAula.includes(newStatus)) {
      return false;
    }

    if (currentStatus === 'AGENDADA' && newStatus !== 'EM_ANDAMENTO') {
      return false;
    }

    if (currentStatus === 'EM_ANDAMENTO' && !statusAulaFinal.includes(newStatus)) {
      return false;
    }

    if (statusAulaFinal.includes(currentStatus) && !statusAulaFinal.includes(newStatus)) {
      return false;
    }

    return true;
  }

  static async handle(req, res) {
    const controller = new AndamentoAulaController(req, res);
    await controller.execute();
  }
}
