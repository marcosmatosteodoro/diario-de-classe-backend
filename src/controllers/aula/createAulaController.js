import AbstractController from '../abstractController.js';
import { CreateAulaService } from '../../services/aula/createAulaService.js';
import { GetContratoService } from '../../services/contrato/getContratoService.js';
import { IsAulaExistsService } from '../../services/aula/isAulaExistsService.js';
import { UpdateAulasContratoService } from '../../services/contrato/updateAulasContratoService.js';

export class CreateAulaController extends AbstractController {
  constructor(req, res) {
    super(req, res);
  }

  async execute() {
    try {
      const { idContrato, idAluno } = this.req.body;
      const contratoDoAluno =
        idContrato && idAluno
          ? await GetContratoService.handle(idContrato, { additionalWhere: { idAluno } })
          : null;
      if (!contratoDoAluno) {
        return this.res.status(422).json({
          message: this.req.t('aulas.create.contrato_nao_pertence_ao_aluno')
        });
      }

      if (await IsAulaExistsService.handle(this.req.body)) {
        return this.res.status(422).json({
          message: this.req.t('aulas.create.ids_exists')
        });
      }

      const data = {
        ...this.req.body,
        status: 'AGENDADA'
      };

      const newAula = await CreateAulaService.handle(data);
      await UpdateAulasContratoService.handle(newAula.idContrato);

      return this.res.status(201).json(newAula);
    } catch (error) {
      return this.handleError(error, 'aulas.create.error');
    }
  }

  static async handle(req, res) {
    const controller = new CreateAulaController(req, res);
    await controller.execute();
  }
}
