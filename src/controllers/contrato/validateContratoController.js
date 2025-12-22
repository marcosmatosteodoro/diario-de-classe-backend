import AbstractController from '../abstractController.js';
import ContratoRepository from '../../repositories/contratoRepository.js';
import { GetAulaListService } from '../../services/aula/getAulaListService.js';
import { GetUserListService } from '../../services/user/getUserListService.js';
import { UpdateContratoService } from '../../services/contrato/updateContratoService.js';

export class ValidateContratoController extends AbstractController {
  constructor(req, res) {
    super(req, res);
    this.repository = new ContratoRepository();
  }

  async execute() {
    try {
      const id = this.req.validatedId || this.req.params.id;
      const contrato = await this.repository.selectOne({
        where: { id: id },
        select: this.repository.getSelectFieldsWithRelations()
      });
      const aulas = await GetAulaListService.handle({ idContrato: id });
      const idProfessores = [...new Set(aulas.map(aula => aula.idProfessor))];
      const professores = await GetUserListService.handle({ id: { in: idProfessores } });
      const confirmation = this.req.query.confirmation || 'false';

      if (!contrato) {
        return this.res.status(404).json({
          message: this.req.t('contratos.get.not_found')
        });
      }

      if (professores.length === 0 || professores.length !== idProfessores.length) {
        return this.res.status(422).json({
          message: this.req.t('contratos.validate.professores_not_exists')
        });
      }

      if (!contrato.aluno) {
        return this.res.status(422).json({
          message: this.req.t('contratos.validate.aluno_not_exists')
        });
      }

      if (!contrato.dataInicio || !contrato.dataTermino) {
        return this.res.status(422).json({
          message: this.req.t('contratos.validate.invalid_dates')
        });
      }

      if (!aulas || aulas.length === 0) {
        return this.res.status(422).json({
          message: this.req.t('contratos.validate.no_classes')
        });
      }

      if (contrato.status === 'ATIVO') {
        return this.res.status(422).json({
          message: this.req.t('contratos.validate.contrato_actived')
        });
      }

      if (contrato.status === 'CANCELADO' && confirmation !== 'CANCELADO') {
        return this.res.status(422).json({
          message: this.req.t('contratos.validate.contrato_canceled_confirmation_required')
        });
      }

      if (contrato.status === 'INATIVO' && confirmation !== 'INATIVO') {
        return this.res.status(422).json({
          message: this.req.t('contratos.validate.contrato_inativo_confirmation_required')
        });
      }

      const data = await UpdateContratoService.handle(id, { status: 'ATIVO' });

      return this.res.status(200).json(data);
    } catch (error) {
      return this.handleError(error, 'contratos.validate.error');
    }
  }

  static async handle(req, res) {
    const controller = new ValidateContratoController(req, res);
    await controller.execute();
  }
}
