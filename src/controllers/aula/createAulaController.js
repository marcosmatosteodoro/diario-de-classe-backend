import { AbstractAulaController } from './AbstractAulaController.js';
import { CreateAulaService } from '../../services/aula/createAulaService.js';
import { GetContratoService } from '../../services/contrato/getContratoService.js';
import { IsAulaExistsService } from '../../services/aula/isAulaExistsService.js';
import { GetContratoListService } from '../../services/contrato/getContratoListService.js';
import { UpdateAulasContratoService } from '../../services/contrato/updateAulasContratoService.js';

export class CreateAulaController extends AbstractAulaController {
  async execute() {
    try {
      if (!this.req.user.isAdmin && !this.req.user.id) {
        return this.res.status(403).json({ message: this.req.t('api.errors.forbidden') });
      }

      const body = this.req.user.isAdmin
        ? this.req.body
        : { ...this.req.body, idProfessor: this.req.user.id };

      if (!this.req.user.isAdmin && !(await this.isParContratoAlunoDoProfessor(body))) {
        return this.res.status(403).json({ message: this.req.t('api.errors.forbidden') });
      }

      const { idContrato, idAluno } = body;
      const contratoDoAluno =
        idContrato && idAluno
          ? await GetContratoService.handle(idContrato, { additionalWhere: { idAluno } })
          : null;
      if (!contratoDoAluno) {
        return this.res.status(422).json({
          message: this.req.t('aulas.create.contrato_nao_pertence_ao_aluno')
        });
      }

      if (await IsAulaExistsService.handle(body)) {
        return this.res.status(422).json({
          message: this.req.t('aulas.create.ids_exists')
        });
      }

      const data = {
        ...body,
        status: 'AGENDADA'
      };

      const newAula = await CreateAulaService.handle(data);
      await UpdateAulasContratoService.handle(newAula.idContrato);

      return this.res.status(201).json(newAula);
    } catch (error) {
      return this.handleError(error, 'aulas.create.error');
    }
  }

  // A posse prévia vem de aula existente do professor; criar aula nunca a concede.
  async isParContratoAlunoDoProfessor({ idContrato, idAluno }) {
    const contratos = await GetContratoListService.handle({
      AND: [{ aulas: { some: { idProfessor: this.req.user.id } } }, { id: idContrato, idAluno }]
    });
    return Array.isArray(contratos) && contratos.length > 0;
  }

  static async handle(req, res) {
    const controller = new CreateAulaController(req, res);
    await controller.execute();
  }
}
