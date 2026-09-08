import AbstractService from '../abstractService.js';
import AulaRepository from '../../repositories/aulaRepository.js';
import { GetConteudoLivroListService } from '../conteudoLivro/getConteudoLivroListService.js';
import { GetCronogramaAtivoService } from './getCronogramaAtivoService.js';
import { aulaConsomeConteudo } from '../../utilities/cronogramaRules.js';

/**
 * Monta a projecao do cronograma do aluno: a grade de aulas do contrato em
 * curso com o conteudo do livro vinculado a cada uma. E a leitura que a escola
 * chama de "planilha" -- uma linha por aula, na ordem das datas.
 *
 * Nao calcula nada: apenas le o vinculo que o ResequenciarCronogramaService
 * gravou. Assim a tela e o Excel mostram exatamente o que esta no banco.
 */
export class GetProjecaoCronogramaService extends AbstractService {
  constructor(Repository, idAluno, additionalWhere, idContrato) {
    super(Repository);
    this.idAluno = idAluno;
    this.additionalWhere = additionalWhere;
    this.idContrato = idContrato;
  }

  async execute() {
    const cronograma = await GetCronogramaAtivoService.handle(
      // Sem idContrato, um aluno com dois contratos ativos (ingles e espanhol)
      // teria um deles escolhido pela ordenacao; informando, a leitura e exata.
      { idAluno: this.idAluno, idContrato: this.idContrato },
      this.additionalWhere
    );

    if (!cronograma) {
      return null;
    }

    const [conteudos, aulas] = await Promise.all([
      GetConteudoLivroListService.handle({ idLivro: cronograma.idLivro }),
      this.repository.selectMany({
        where: { idContrato: cronograma.idContrato },
        select: this.repository.getSelectFieldsWithConteudo(),
        orderBy: [{ dataAula: 'asc' }, { horaInicial: 'asc' }]
      })
    ]);

    const linhas = aulas.map(aula => this.montarLinha(aula));
    // So conta como vinculado o conteudo do livro em curso: as aulas
    // concluidas de um livro anterior tambem tem idConteudo, e contando todas o
    // `conteudosRestantes` ficava negativo.
    const idsDoLivro = new Set(conteudos.map(conteudo => conteudo.id));
    const vinculados = new Set(
      aulas
        .map(aula => aula.idConteudo)
        .filter(idConteudo => Boolean(idConteudo) && idsDoLivro.has(idConteudo))
    );

    return {
      cronograma,
      linhas,
      // Conteudo que ainda nao caiu em nenhuma aula: sinaliza que o livro nao
      // vai terminar dentro do contrato atual.
      conteudosNaoAgendados: conteudos
        .filter(conteudo => !vinculados.has(conteudo.id))
        .map(({ id, ordem, titulo, descricao }) => ({ id, ordem, titulo, descricao })),
      resumo: {
        totalAulas: aulas.length,
        totalConteudos: conteudos.length,
        conteudosVinculados: vinculados.size,
        conteudosRestantes: conteudos.length - vinculados.size,
        aulasSemConteudo: aulas.filter(aula => aulaConsomeConteudo(aula) && !aula.idConteudo).length
      }
    };
  }

  montarLinha(aula) {
    // Uma unica desestruturacao com default: encadear `?.` em cada campo
    // multiplicava os ramos e estourava o limite de complexidade do lint.
    const conteudo = aula.conteudo || {};

    return {
      idAula: aula.id,
      dataAula: aula.dataAula,
      horaInicial: aula.horaInicial,
      horaFinal: aula.horaFinal,
      tipo: aula.tipo,
      status: aula.status,
      observacao: aula.observacao,
      idConteudo: aula.idConteudo,
      conteudoManual: aula.conteudoManual,
      idLivro: conteudo.idLivro || null,
      livroNome: conteudo.livro ? conteudo.livro.nome : null,
      ordem: conteudo.ordem || null,
      titulo: conteudo.titulo || null,
      descricao: conteudo.descricao || null
    };
  }

  static async handle(idAluno, additionalWhere = {}, idContrato = null) {
    const Repository = AulaRepository;
    const service = new GetProjecaoCronogramaService(
      Repository,
      idAluno,
      additionalWhere,
      idContrato
    );
    return await service.execute();
  }
}
