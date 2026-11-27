const CHAVES_DO_WHERE = ['dataAula', 'idProfessor', 'status'];
const CHAVES_DO_INTERVALO = ['gte', 'lte'];
const RELACOES_COM_NOME = ['aluno', 'professor'];
const ESCALARES = ['id', 'dataAula', 'horaInicial', 'horaFinal', 'tipo', 'status'];

const rejeitar = mensagem => {
  throw new Error(`seedAgendaEmMemoria: ${mensagem}`);
};

function validarWhere(where) {
  for (const chave of Object.keys(where ?? {})) {
    if (!CHAVES_DO_WHERE.includes(chave)) rejeitar(`chave de where não suportada: ${chave}`);
  }
  for (const chave of Object.keys(where?.dataAula ?? {})) {
    if (!CHAVES_DO_INTERVALO.includes(chave))
      rejeitar(`filtro de dataAula não suportado: ${chave}`);
  }
}

function projetar(registro, select) {
  const saida = {};
  for (const [chave, valor] of Object.entries(select)) {
    if (!valor) continue;
    if (ESCALARES.includes(chave)) saida[chave] = registro[chave];
    else if (RELACOES_COM_NOME.includes(chave)) saida[chave] = { nome: registro[chave].nome };
    else rejeitar(`campo de select não suportado: ${chave}`);
  }
  return saida;
}

/**
 * Dublê de `aula.findMany` com o filtro que `getAulaListController` monta (`dataAula` com
 * `gte`/`lte`, `idProfessor`, `status`) e o `select` da listagem. Chave de `where` fora desse
 * conjunto rejeita: o fake falha alto quando o filtro do controller muda.
 * @param {{ aulas: object[], alunos: Array<{id:string,nome:string}>, professores: Array<{id:string,nome:string}> }} dados
 *   `aulas` no formato enviado ao `CreateAulaService`, com `id` atribuído
 * @returns {{ findMany: (opcoes: { where?: object, select: object, orderBy?: object }) => Promise<object[]> }}
 */
export function seedAgendaEmMemoria({ aulas, alunos, professores }) {
  const porId = lista => new Map(lista.map(item => [item.id, item]));
  const alunoPorId = porId(alunos);
  const professorPorId = porId(professores);

  return {
    async findMany({ where, select }) {
      validarWhere(where);
      const { dataAula, idProfessor, status } = where ?? {};

      return aulas
        .filter(aula => {
          if (dataAula?.gte && aula.dataAula < dataAula.gte) return false;
          if (dataAula?.lte && aula.dataAula > dataAula.lte) return false;
          if (idProfessor !== undefined && aula.idProfessor !== idProfessor) return false;
          if (status !== undefined && aula.status !== status) return false;
          return true;
        })
        .sort((a, b) => a.dataAula - b.dataAula)
        .map(aula =>
          projetar(
            {
              ...aula,
              aluno: alunoPorId.get(aula.idAluno),
              professor: professorPorId.get(aula.idProfessor)
            },
            select
          )
        );
    }
  };
}
