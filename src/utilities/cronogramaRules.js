/**
 * Regra de negocio unica do cronograma: quais aulas consomem conteudo do livro.
 *
 * A data de cada conteudo NAO e fixa. O vinculo mora em `Aula.idConteudo` e a
 * ordem e derivada percorrendo as aulas do contrato por data: a n-esima aula
 * que consome conteudo recebe o n-esimo conteudo do livro. Assim, quando uma
 * aula e cancelada ou o aluno falta, ela deixa de consumir e o conteudo
 * escorrega sozinho para a aula seguinte.
 *
 * Mantido em um lugar so de proposito: se a escola mudar a regra (por exemplo,
 * passar a contar falta como conteudo dado), muda-se apenas este arquivo.
 */

/**
 * Status de contrato que aceitam cronograma novo. Contrato encerrado nao tem
 * aula futura para distribuir conteudo.
 */
export const STATUS_CONTRATO_ACEITA_CRONOGRAMA = ['ATIVO', 'PENDENTE'];

/** Status de aula que consomem conteudo. */
export const STATUS_CONSOME_CONTEUDO = ['AGENDADA', 'EM_ANDAMENTO', 'CONCLUIDA'];

/** Tipos de aula que consomem conteudo. REPOSICAO repoe o conteudo perdido. */
export const TIPO_CONSOME_CONTEUDO = ['PADRAO', 'REPOSICAO'];

/**
 * Status que tornam o vinculo historico: a aula ja aconteceu e o conteudo que
 * ela cobriu e fato registrado. O resequenciador nunca reescreve essas aulas.
 */
export const STATUS_CONGELA_CONTEUDO = ['CONCLUIDA'];

/**
 * Indica se a aula consome um conteudo do livro.
 * @param {{ status: string, tipo: string }} aula
 * @returns {boolean}
 */
export function aulaConsomeConteudo(aula) {
  if (!aula) return false;
  return STATUS_CONSOME_CONTEUDO.includes(aula.status) && TIPO_CONSOME_CONTEUDO.includes(aula.tipo);
}

/**
 * Indica se o vinculo da aula esta congelado e nao pode ser resequenciado.
 * Vale para aula concluida (fato historico) e para escolha manual do professor.
 * @param {{ status: string, conteudoManual: boolean }} aula
 * @returns {boolean}
 */
export function aulaTemConteudoCongelado(aula) {
  if (!aula) return false;
  return STATUS_CONGELA_CONTEUDO.includes(aula.status) || aula.conteudoManual === true;
}
