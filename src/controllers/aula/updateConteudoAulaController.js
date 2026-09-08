import { AbstractAulaController } from './AbstractAulaController.js';
import { GetAulaService } from '../../services/aula/getAulaService.js';
import { UpdateConteudoAulaService } from '../../services/aula/updateConteudoAulaService.js';
import { IsConteudoCongeladoEmOutraAulaService } from '../../services/aula/isConteudoCongeladoEmOutraAulaService.js';
import { GetConteudoLivroService } from '../../services/conteudoLivro/getConteudoLivroService.js';
import { GetCronogramaAtivoService } from '../../services/cronograma/getCronogramaAtivoService.js';
import { ResequenciarCronogramaService } from '../../services/cronograma/resequenciarCronogramaService.js';
import { aulaConsomeConteudo } from '../../utilities/cronogramaRules.js';

/**
 * Lancamento por conteudo: o professor escolhe a mao qual conteudo do livro
 * aquela aula cobriu, em vez de aceitar a sequencia automatica.
 *
 * Rota propria (e nao o PUT generico da aula) porque aqui so `idConteudo` pode
 * mudar e o vinculo precisa passar por tres checagens de servidor: a aula e do
 * professor, o conteudo pertence ao livro em curso daquele contrato, e o
 * conteudo nao esta preso a outra aula.
 *
 * Enviar `idConteudo: null` devolve a aula ao controle do resequenciador.
 */
export class UpdateConteudoAulaController extends AbstractAulaController {
  constructor(req, res) {
    super(req, res);
  }

  async execute() {
    try {
      const id = this.req.validatedId || this.req.params.id;
      const aula = await GetAulaService.handle(id, this.where);

      if (!aula) {
        return this.res.status(404).json({
          message: this.req.t('aulas.get.not_found')
        });
      }

      const { idConteudo = null } = this.req.validatedData;

      if (idConteudo) {
        const erro = await this.validarConteudo(aula, idConteudo);

        if (erro) {
          return this.res.status(erro.status).json({ message: this.req.t(erro.chave) });
        }
      }

      await UpdateConteudoAulaService.handle(id, idConteudo);

      // Fixar ou soltar uma aula muda a sequencia das demais.
      const resequenciamento = await ResequenciarCronogramaService.handle(aula.idContrato);

      // Reler depois do resequenciamento: ao soltar a aula (idConteudo nulo) o
      // resequenciador ja regravou um conteudo, e devolver o objeto capturado
      // antes fazia o front exibir nulo enquanto o banco tinha outro valor.
      const aulaAtualizada = await GetAulaService.handle(id, this.where);

      return this.res.status(200).json({
        ...aulaAtualizada,
        resequenciamento
      });
    } catch (error) {
      return this.handleError(error, 'aulas.conteudo.error');
    }
  }

  /**
   * Devolve o erro a responder, ou null quando o vinculo e valido.
   * Nega por padrao: qualquer checagem que nao confirme o vinculo bloqueia.
   */
  async validarConteudo(aula, idConteudo) {
    if (!aulaConsomeConteudo(aula)) {
      return { status: 422, chave: 'aulas.conteudo.aula_nao_consome' };
    }

    const cronograma = await GetCronogramaAtivoService.handle({ idContrato: aula.idContrato });

    if (!cronograma) {
      return { status: 422, chave: 'aulas.conteudo.sem_cronograma' };
    }

    const conteudo = await GetConteudoLivroService.handle(idConteudo);

    if (!conteudo) {
      return { status: 404, chave: 'conteudosLivro.get.not_found' };
    }

    // O conteudo tem que ser do livro que o aluno esta cursando. Sem isso, um
    // id de outro livro passado no corpo entraria no cronograma.
    if (conteudo.idLivro !== cronograma.idLivro) {
      return { status: 422, chave: 'aulas.conteudo.fora_do_livro' };
    }

    const jaPreso = await IsConteudoCongeladoEmOutraAulaService.handle({
      idContrato: aula.idContrato,
      idConteudo,
      idAulaIgnorada: aula.id
    });

    if (jaPreso) {
      return { status: 409, chave: 'aulas.conteudo.ja_vinculado' };
    }

    return null;
  }

  static async handle(req, res) {
    const controller = new UpdateConteudoAulaController(req, res);
    await controller.execute();
  }
}
