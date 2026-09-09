import { AbstractCronogramaController } from './AbstractCronogramaController.js';
import { GetContratoService } from '../../services/contrato/getContratoService.js';
import { GetLivroService } from '../../services/livro/getLivroService.js';
import { CreateCronogramaService } from '../../services/cronograma/createCronogramaService.js';
import { ResequenciarCronogramaService } from '../../services/cronograma/resequenciarCronogramaService.js';
import { STATUS_CONTRATO_ACEITA_CRONOGRAMA } from '../../utilities/cronogramaRules.js';

/**
 * Matricula o aluno em um livro: "o aluno entrou hoje no livro X".
 * Encerra o livro anterior, abre o novo e ja distribui os conteudos pelas
 * aulas do contrato.
 */
export class CreateCronogramaController extends AbstractCronogramaController {
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

      const { idContrato, idLivro, dataInicio } = this.req.validatedData;

      const contrato = await GetContratoService.handle(idContrato);

      // O contrato tem que ser do aluno da rota. Sem esta checagem, um contrato
      // de outro aluno passado no corpo criaria cronograma cruzado.
      if (!contrato || contrato.idAluno !== idAluno) {
        return this.res.status(404).json({
          message: this.req.t('cronogramas.error.contrato_not_exists')
        });
      }

      const livro = await GetLivroService.handle(idLivro);

      if (!livro) {
        return this.res.status(404).json({
          message: this.req.t('cronogramas.error.livro_not_exists')
        });
      }

      if (!livro.ativo) {
        return this.res.status(422).json({
          message: this.req.t('cronogramas.create.livro_inativo')
        });
      }

      // Contrato encerrado nao recebe cronograma novo: nao ha aula futura para
      // distribuir conteudo.
      if (!STATUS_CONTRATO_ACEITA_CRONOGRAMA.includes(contrato.status)) {
        return this.res.status(422).json({
          message: this.req.t('cronogramas.create.contrato_indisponivel', {
            status: contrato.status
          })
        });
      }

      // Livro de outro idioma que o do contrato monta um cronograma que nao faz
      // sentido pedagogico -- e nada no banco impedia.
      if (livro.idioma !== contrato.idioma) {
        return this.res.status(422).json({
          message: this.req.t('cronogramas.create.idioma_divergente', {
            livro: livro.idioma,
            contrato: contrato.idioma
          })
        });
      }

      const cronograma = await CreateCronogramaService.handle({
        idAluno,
        idContrato,
        idLivro,
        dataInicio
      });

      const resequenciamento = await ResequenciarCronogramaService.handle(idContrato);

      return this.res.status(201).json({
        ...cronograma,
        resequenciamento
      });
    } catch (error) {
      return this.handleError(error, 'cronogramas.create.error');
    }
  }

  static async handle(req, res) {
    const controller = new CreateCronogramaController(req, res);
    await controller.execute();
  }
}
