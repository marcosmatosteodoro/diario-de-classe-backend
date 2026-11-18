import { diaDaSemana, paraDataAula, somarDias } from './seedCalendario.js';

/** Dias antes de `hoje` em que o contrato demo começa.
 * @type {number}
 */
export const CONTRATO_INICIO_DIAS_ANTES = 45;
/** Dias depois de `hoje` em que o contrato demo termina.
 * @type {number}
 */
export const CONTRATO_TERMINO_DIAS_DEPOIS = 180;
/** Janela de aulas passadas, em dias antes de `hoje`.
 * @type {number}
 */
export const AULAS_PASSADAS_DIAS_ANTES = 28;
/** Janela de aulas futuras, em dias depois de `hoje`.
 * @type {number}
 */
export const AULAS_FUTURAS_DIAS_DEPOIS = 35;

const MODULO_FALTA = 6;
const RESTO_FALTA = 5;
const MODULO_CANCELADA = 9;
const RESTO_CANCELADA = 7;
const INDICE_REPOSICAO = 3;

const OBSERVACAO_POR_STATUS = {
  CONCLUIDA: 'Aula realizada conforme o planejado.',
  CANCELADA: 'Aula cancelada com aviso prévio.',
  CANCELADA_POR_FALTA: 'Aluno não compareceu à aula.',
  AGENDADA: 'Aula agendada para este dia.'
};

// Estado por posição na sequência de passadas do aluno (da mais antiga, a partir de 0), sem
// sorteio: o índice 3 é a reposição concluída e não colide com 5 (falta) nem 7 (cancelada)
// (DEC-004-005 · demonstracao).
function statusDaPassada(indice) {
  if (indice % MODULO_FALTA === RESTO_FALTA) return 'CANCELADA_POR_FALTA';
  if (indice % MODULO_CANCELADA === RESTO_CANCELADA) return 'CANCELADA';
  return 'CONCLUIDA';
}

function gerarAulasDoAluno(hoje, aluno) {
  const aulas = [];
  const inicio = somarDias(hoje, -AULAS_PASSADAS_DIAS_ANTES);
  const fim = somarDias(hoje, AULAS_FUTURAS_DIAS_DEPOIS);
  let indicePassada = 0;

  for (let dia = inicio; dia <= fim; dia = somarDias(dia, 1)) {
    if (!aluno.diasAula.includes(diaDaSemana(dia))) continue;

    let status = 'AGENDADA';
    let tipo = 'PADRAO';
    if (dia < hoje) {
      status = statusDaPassada(indicePassada);
      if (indicePassada === INDICE_REPOSICAO) tipo = 'REPOSICAO';
      indicePassada += 1;
    }

    aulas.push({
      chaveAluno: aluno.chave,
      chaveProfessor: aluno.chaveProfessor,
      dataAula: paraDataAula(dia),
      horaInicial: aluno.horaInicial,
      horaFinal: aluno.horaFinal,
      status,
      tipo,
      observacao: OBSERVACAO_POR_STATUS[status]
    });
  }

  return aulas;
}

/**
 * Gera contratos, dias de aula e aulas do seed a partir de `hoje`, sem sortear e sem mutar
 * `alunos`.
 * @param {string} hoje dia civil de referência `YYYY-MM-DD`
 * @param {Array<{chave: string, chaveProfessor: string, diasAula: string[], horaInicial: string, horaFinal: string}>} alunos
 * @returns {{
 *   contratos: Array<{chaveAluno: string, dataInicio: Date, dataTermino: Date, status: 'ATIVO'}>,
 *   diasAula: Array<{chaveAluno: string, diaSemana: string, quantidadeAulas: number, horaInicial: string, horaFinal: string}>,
 *   aulas: Array<{chaveAluno: string, chaveProfessor: string, dataAula: Date, horaInicial: string, horaFinal: string, status: 'CONCLUIDA'|'CANCELADA'|'CANCELADA_POR_FALTA'|'AGENDADA', tipo: 'PADRAO'|'REPOSICAO', observacao: string}>
 * }} `contratos` na ordem de `alunos`; `aulas` passadas registradas e de hoje em diante agendadas
 * @throws {RangeError} quando `hoje` não está no formato `YYYY-MM-DD`
 */
export function gerarAgenda(hoje, alunos) {
  const dataInicio = paraDataAula(somarDias(hoje, -CONTRATO_INICIO_DIAS_ANTES));
  const dataTermino = paraDataAula(somarDias(hoje, CONTRATO_TERMINO_DIAS_DEPOIS));

  const contratos = alunos.map(aluno => ({
    chaveAluno: aluno.chave,
    dataInicio: new Date(dataInicio),
    dataTermino: new Date(dataTermino),
    status: 'ATIVO'
  }));

  const diasAula = alunos.flatMap(aluno =>
    aluno.diasAula.map(diaSemana => ({
      chaveAluno: aluno.chave,
      diaSemana,
      quantidadeAulas: 1,
      horaInicial: aluno.horaInicial,
      horaFinal: aluno.horaFinal
    }))
  );

  const aulas = alunos.flatMap(aluno => gerarAulasDoAluno(hoje, aluno));

  return { contratos, diasAula, aulas };
}
