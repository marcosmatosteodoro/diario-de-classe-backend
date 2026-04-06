import AbstractController from '../abstractController.js';
import { GetUserListService } from '../../services/user/getUserListService.js';
import { GetAlunoListService } from '../../services/aluno/getAlunoListService.js';
import { UpdateUserService } from '../../services/user/updateUserService.js';

export class UpdateNomeCompletoController extends AbstractController {
  constructor(req, res) {
    super(req, res);
    const comonData = {
      encontrados: 0,
      atualizados: 0,
      ignorados: 0,
      erros: 0,
      detalhesErros: []
    };
    this.professorData = comonData;
    this.alunoData = comonData;
  }

  async updateProfessores() {
    const professores = await GetUserListService.handle();

    if (!professores || professores.length === 0) {
      return;
    }

    await Promise.all(
      professores.map(async professor => {
        const nomeCompleto = `${professor.nome} ${professor.sobrenome}`;
        if (professor.nomeCompleto === nomeCompleto) {
          this.professorData.ignorados += 1;
          return;
        }
        try {
          await UpdateUserService.handle({
            id: professor.id,
            nomeCompleto
          });
          this.professorData.atualizados += 1;
        } catch (error) {
          this.professorData.erros += 1;
          this.professorData.detalhesErros.push({
            id: professor.id,
            error: error.message
          });
        }
      })
    );
  }

  async updateAlunos() {
    const alunos = await GetAlunoListService.handle();

    if (!alunos || alunos.length === 0) {
      return;
    }

    await Promise.all(
      alunos.map(async aluno => {
        const nomeCompleto = `${aluno.nome} ${aluno.sobrenome}`;
        if (aluno.nomeCompleto === nomeCompleto) {
          this.alunoData.ignorados += 1;
          return;
        }
        try {
          await UpdateUserService.handle({
            id: aluno.id,
            nomeCompleto
          });
          this.alunoData.atualizados += 1;
        } catch (error) {
          this.alunoData.erros += 1;
          this.alunoData.detalhesErros.push({
            id: aluno.id,
            error: error.message
          });
        }
      })
    );
  }

  async execute() {
    try {
      await Promise.all([this.updateProfessores(), this.updateAlunos()]);

      return this.res.status(200).json({
        count: this.professorData.atualizados + this.alunoData.atualizados,
        data: {
          professores: this.professorData,
          alunos: this.alunoData
        }
      });
    } catch (error) {
      return this.handleError(error, 'admin.updateNomeCompleto.error');
    }
  }

  static async handle(req, res) {
    const controller = new UpdateNomeCompletoController(req, res);
    await controller.execute();
  }
}
