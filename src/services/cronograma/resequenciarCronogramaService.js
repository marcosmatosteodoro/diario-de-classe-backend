import AbstractService from '../abstractService.js';
import AulaRepository from '../../repositories/aulaRepository.js';
import { GetConteudoLivroListService } from '../conteudoLivro/getConteudoLivroListService.js';
import { GetCronogramaAtivoService } from './getCronogramaAtivoService.js';
import { aulaConsomeConteudo, aulaTemConteudoCongelado } from '../../utilities/cronogramaRules.js';

/**
 * Recalcula o vinculo aula -> conteudo do livro para um contrato.
 *
 * A data de cada conteudo nao e fixa: a sequencia e derivada percorrendo as
 * aulas do contrato por data e entregando o proximo conteudo do livro a cada
 * aula que consome conteudo (ver utilities/cronogramaRules.js). Assim, cancelar
 * uma aula ou marcar falta faz o conteudo escorregar para a aula seguinte sem
 * precisar reescrever datas.
 *
 * Dois vinculos nunca sao tocados:
 * - aula CONCLUIDA, porque o conteudo que ela cobriu e fato historico;
 * - aula com `conteudoManual`, porque o professor escolheu aquele conteudo a mao
 *   e o resequenciamento seguinte desfaria a escolha dele.
 *
 * Deve ser chamado depois de: gerar/editar aulas do contrato, cancelar aula ou
 * marcar falta, matricular o aluno em um livro novo e reordenar conteudos.
 */
export class ResequenciarCronogramaService extends AbstractService {
  constructor(Repository, idContrato) {
    super(Repository);
    this.idContrato = idContrato;
  }

  async execute() {
    const cronograma = await GetCronogramaAtivoService.handle({ idContrato: this.idContrato });

    if (!cronograma) {
      return {
        resequenciado: false,
        motivo: 'sem_cronograma_ativo',
        aulasAtualizadas: 0
      };
    }

    const conteudos = await GetConteudoLivroListService.handle({ idLivro: cronograma.idLivro });
    const aulas = await this.repository.selectMany({
      where: { idContrato: this.idContrato },
      select: this.repository.getSelectFieldsForResequenciamento(),
      orderBy: [{ dataAula: 'asc' }, { horaInicial: 'asc' }]
    });

    const vinculos = this.calcularVinculos(aulas, conteudos, cronograma.dataInicio);
    const alteracoes = vinculos
      .filter(vinculo => vinculo.alterado)
      .map(({ id, idConteudo }) => ({ id, idConteudo }));

    const aulasAtualizadas = await this.repository.updateConteudoEmLote(alteracoes);

    return {
      resequenciado: true,
      idLivro: cronograma.idLivro,
      aulasAtualizadas,
      ...this.montarResumo(vinculos, conteudos)
    };
  }

  /**
   * Calcula o vinculo de cada aula. Funcao pura: recebe as aulas em ordem de
   * data e os conteudos em ordem de `ordem`, devolve o vinculo desejado e se
   * ele difere do que esta gravado.
   *
   * @param {Array<Object>} aulas ordenadas por dataAula
   * @param {Array<Object>} conteudos ordenados por ordem
   * @param {Date|string|null} dataInicio inicio do livro em curso; aula anterior
   *   a ela pertence ao livro anterior e nao consome conteudo deste
   * @returns {Array<{ id: string, idConteudo: string|null, alterado: boolean, consome: boolean }>}
   */
  calcularVinculos(aulas, conteudos, dataInicio = null) {
    const inicio = dataInicio ? new Date(dataInicio) : null;
    // Conteudos presos a aulas congeladas saem da fila: nao podem ser
    // entregues de novo a outra aula, senao o cronograma repetiria conteudo.
    const conteudosPresos = new Set(
      aulas
        .filter(aula => aulaTemConteudoCongelado(aula) && aula.idConteudo)
        .map(aula => aula.idConteudo)
    );

    const fila = conteudos.filter(conteudo => !conteudosPresos.has(conteudo.id));
    let proximo = 0;

    return aulas.map(aula => {
      // Aula anterior ao inicio do livro pertence ao livro anterior. Sem esta
      // checagem, uma aula AGENDADA com data antes da matricula recebia o
      // primeiro conteudo do livro novo.
      const dentroDoLivro = !inicio || new Date(aula.dataAula) >= inicio;
      const consome = aulaConsomeConteudo(aula) && dentroDoLivro;
      let idConteudo;

      if (aulaTemConteudoCongelado(aula)) {
        // Preserva exatamente o que esta gravado, inclusive nulo.
        idConteudo = aula.idConteudo;
      } else if (consome) {
        idConteudo = proximo < fila.length ? fila[proximo].id : null;
        if (idConteudo) proximo += 1;
      } else {
        // Aula cancelada, falta ou tipo OUTRA nao carrega conteudo.
        idConteudo = null;
      }

      return {
        id: aula.id,
        idConteudo,
        consome,
        alterado: idConteudo !== aula.idConteudo
      };
    });
  }

  /**
   * Resumo que a escola usa para perceber desencontro entre livro e contrato:
   * conteudo que nao vai caber nas aulas restantes, ou aula sobrando sem
   * conteudo porque o livro terminou antes do contrato.
   */
  montarResumo(vinculos, conteudos) {
    // Intersecta com os conteudos do livro atual: as aulas concluidas de um
    // livro anterior tambem tem idConteudo, e contando todas o
    // `conteudosRestantes` ficava negativo e contradizia
    // `conteudosNaoAgendados`, que filtra corretamente.
    const idsDoLivro = new Set(conteudos.map(conteudo => conteudo.id));
    const vinculados = new Set(
      vinculos
        .map(vinculo => vinculo.idConteudo)
        .filter(idConteudo => Boolean(idConteudo) && idsDoLivro.has(idConteudo))
    );

    return {
      totalConteudos: conteudos.length,
      conteudosVinculados: vinculados.size,
      conteudosRestantes: conteudos.length - vinculados.size,
      aulasSemConteudo: vinculos.filter(vinculo => vinculo.consome && !vinculo.idConteudo).length
    };
  }

  static async handle(idContrato) {
    const Repository = AulaRepository;
    const service = new ResequenciarCronogramaService(Repository, idContrato);
    return await service.execute();
  }
}
