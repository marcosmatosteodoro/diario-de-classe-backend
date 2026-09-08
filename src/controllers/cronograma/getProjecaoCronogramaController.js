import { AbstractCronogramaController } from './AbstractCronogramaController.js';
import { GetProjecaoCronogramaService } from '../../services/cronograma/getProjecaoCronogramaService.js';

/**
 * A "planilha" do aluno: uma linha por aula, com o conteudo do livro vinculado.
 */
export class GetProjecaoCronogramaController extends AbstractCronogramaController {
  constructor(req, res) {
    super(req, res);
  }

  async execute() {
    try {
      const idAluno = this.req.validatedId || this.req.params.id;
      const aluno = await this.getAlunoAcessivel(idAluno);

      if (!aluno) {
        return this.res.status(404).json({
          message: this.req.t('alunos.get.not_found')
        });
      }

      const projecao = await GetProjecaoCronogramaService.handle(
        idAluno,
        this.where,
        this.req.query.idContrato || null
      );

      // Aluno sem livro em curso nao e erro: e o estado inicial, antes de a
      // secretaria matricular.
      if (!projecao) {
        return this.res.status(204).json();
      }

      return this.res.status(200).json({
        aluno: {
          id: aluno.id,
          nome: aluno.nome,
          sobrenome: aluno.sobrenome,
          nomeCompleto: aluno.nomeCompleto
        },
        ...projecao
      });
    } catch (error) {
      return this.handleError(error, 'cronogramas.get.error');
    }
  }

  static async handle(req, res) {
    const controller = new GetProjecaoCronogramaController(req, res);
    await controller.execute();
  }
}
