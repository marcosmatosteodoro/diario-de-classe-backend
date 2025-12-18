import AbstractController from '../abstractController.js';
import { CreateAulaService } from '../../services/aula/createAulaService.js';
import { GetAlunoService } from '../../services/aluno/getAlunoService.js';
import { GetContratoService } from '../../services/contrato/getContratoService.js';
import { GetUserService } from '../../services/user/getUserService.js';
import { GetAulaListService } from '../../services/aula/getAulaListService.js';
import { DeleteAulaService } from '../../services/aula/deleteAulaService.js';
import { UpdateAulaService } from '../../services/aula/updateAulaService.js';

export class CreateManyAulaController extends AbstractController {
  constructor(req, res) {
    super(req, res);
    this.aulasData = [];
  }

  async execute() {
    try {
      const idContrato = this.req.validatedId || this.req.params.id;
      const idAluno = this.req.body.idAluno;
      const idProfessor = this.req.body.idProfessor;
      const aulas = this.req.body.aulas;
      const isContratoExists = await this.isContratoExists(idContrato);
      const isAlunoExists = await this.isAlunoExists(idAluno);
      const isProfessorExists = await this.isProfessorExists(idProfessor);
      const aulasExisted = await GetAulaListService.handle({ idContrato, idAluno, idProfessor });

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

      if (!isProfessorExists) {
        return this.res.status(422).json({
          message: this.req.t('aulas.error.professor_not_exists')
        });
      }

      // Delete // Update
      aulasExisted.forEach(async aulaEx => {
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

          this.aulasData.push(result);
        }
      });
      // Create
      aulas.forEach(async aula => {
        const isAulaExist = aulasExisted.find(aulaEx => aulaEx.dataAula === aula.dataAula);
        if (!isAulaExist) {
          const data = this.aulaPrepareData({
            idAluno,
            idProfessor,
            idContrato,
            aula
          });
          const result = await CreateAulaService.handle(data);

          this.aulasData.push(result);
        }
      });

      this.sortAulasByDate();

      return this.res.status(201).json(this.aulasData);
    } catch (error) {
      return this.handleError(error, 'aulas.create.error');
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

  async isProfessorExists(id) {
    const professor = await GetUserService.handle(id);
    return !!professor;
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
      status: 'AGENDADA',
      observacao: aula.observacao
    };
  }

  sortAulasByDate() {
    return this.aulasData.sort((a, b) => new Date(a.dataAula) - new Date(b.dataAula));
  }

  static async handle(req, res) {
    const controller = new CreateManyAulaController(req, res);
    await controller.execute();
  }
}
