const DOMINIO_FICTICIO = 'example.com';

// Catálogo é dado puro: congelado em profundidade para que rodadas repetidas do seed no mesmo
// processo não vazem estado (DEC-004-005 · demonstracao).
function congelar(valor) {
  if (valor && typeof valor === 'object' && !Object.isFrozen(valor)) {
    Object.values(valor).forEach(congelar);
    Object.freeze(valor);
  }
  return valor;
}

/**
 * @typedef {object} ContaDemo
 * @property {string} chave
 * @property {string} nome
 * @property {string} sobrenome
 * @property {string} email e-mail fictício em example.com
 * @property {null} telefone
 * @property {'admin'|'member'} permissao
 * @property {boolean} resetarSenha
 */

/**
 * @typedef {object} AlunoDemo
 * @property {string} chave
 * @property {string} nome
 * @property {string} sobrenome
 * @property {string} email e-mail fictício em example.com
 * @property {null} telefone
 * @property {string} chaveProfessor chave de uma conta de professor do catálogo
 * @property {string[]} diasAula dias da semana de aula (SEGUNDA a SEXTA)
 * @property {string} horaInicial `HH:MM`
 * @property {string} horaFinal `HH:MM`, 40 minutos após `horaInicial`
 */

/**
 * @typedef {object} LivroDemo
 * @property {string} nome
 * @property {string} idioma
 * @property {number|null} nivel
 * @property {boolean} ativo
 */

/** Contas fixas (admin e professor) com e-mail estável.
 * @type {ReadonlyArray<Readonly<ContaDemo>>}
 */
export const CONTAS_FIXAS_DEMO = congelar([
  {
    chave: 'adminFixo',
    nome: 'Helena',
    sobrenome: 'Administradora',
    email: `admin.demo@${DOMINIO_FICTICIO}`,
    telefone: null,
    permissao: 'admin',
    resetarSenha: false
  },
  {
    chave: 'professorFixo',
    nome: 'Rafael',
    sobrenome: 'Professor',
    email: `professor.demo@${DOMINIO_FICTICIO}`,
    telefone: null,
    permissao: 'member',
    resetarSenha: false
  }
]);

/** Professores fictícios além da conta fixa.
 * @type {ReadonlyArray<Readonly<ContaDemo>>}
 */
export const PROFESSORES_DEMO = congelar([
  {
    chave: 'professorA',
    nome: 'Camila',
    sobrenome: 'Andrade',
    email: `camila.andrade@${DOMINIO_FICTICIO}`,
    telefone: null,
    permissao: 'member',
    resetarSenha: false
  },
  {
    chave: 'professorB',
    nome: 'Diego',
    sobrenome: 'Barreto',
    email: `diego.barreto@${DOMINIO_FICTICIO}`,
    telefone: null,
    permissao: 'member',
    resetarSenha: false
  },
  {
    chave: 'professorC',
    nome: 'Elisa',
    sobrenome: 'Cavalcanti',
    email: `elisa.cavalcanti@${DOMINIO_FICTICIO}`,
    telefone: null,
    permissao: 'member',
    resetarSenha: false
  }
]);

const PROFESSOR_FIXO = CONTAS_FIXAS_DEMO[1].chave;

/** Alunos fictícios; os 4 primeiros são da conta fixa de professor: juntos cobrem SEGUNDA a
 * SEXTA e, nos dias em comum, os slots de 40 minutos não se sobrepõem.
 * @type {ReadonlyArray<Readonly<AlunoDemo>>}
 */
export const ALUNOS_DEMO = congelar([
  {
    chave: 'aluno1',
    nome: 'Lucas',
    sobrenome: 'Mendonça',
    email: `lucas.mendonca@${DOMINIO_FICTICIO}`,
    telefone: null,
    chaveProfessor: PROFESSOR_FIXO,
    diasAula: ['SEGUNDA', 'QUARTA'],
    horaInicial: '08:00',
    horaFinal: '08:40'
  },
  {
    chave: 'aluno2',
    nome: 'Isadora',
    sobrenome: 'Castelo',
    email: `isadora.castelo@${DOMINIO_FICTICIO}`,
    telefone: null,
    chaveProfessor: PROFESSOR_FIXO,
    diasAula: ['TERCA', 'QUINTA'],
    horaInicial: '08:00',
    horaFinal: '08:40'
  },
  {
    chave: 'aluno3',
    nome: 'Gabriel',
    sobrenome: 'Rangel',
    email: `gabriel.rangel@${DOMINIO_FICTICIO}`,
    telefone: null,
    chaveProfessor: PROFESSOR_FIXO,
    diasAula: ['QUARTA', 'SEXTA'],
    horaInicial: '08:40',
    horaFinal: '09:20'
  },
  {
    chave: 'aluno4',
    nome: 'Sofia',
    sobrenome: 'Cardim',
    email: `sofia.cardim@${DOMINIO_FICTICIO}`,
    telefone: null,
    chaveProfessor: PROFESSOR_FIXO,
    diasAula: ['SEGUNDA', 'SEXTA'],
    horaInicial: '09:20',
    horaFinal: '10:00'
  },
  {
    chave: 'aluno5',
    nome: 'Miguel',
    sobrenome: 'Brandão',
    email: `miguel.brandao@${DOMINIO_FICTICIO}`,
    telefone: null,
    chaveProfessor: PROFESSORES_DEMO[0].chave,
    diasAula: ['SEGUNDA', 'QUINTA'],
    horaInicial: '08:00',
    horaFinal: '08:40'
  },
  {
    chave: 'aluno6',
    nome: 'Alice',
    sobrenome: 'Nogueira',
    email: `alice.nogueira@${DOMINIO_FICTICIO}`,
    telefone: null,
    chaveProfessor: PROFESSORES_DEMO[0].chave,
    diasAula: ['TERCA', 'SEXTA'],
    horaInicial: '08:40',
    horaFinal: '09:20'
  },
  {
    chave: 'aluno7',
    nome: 'Arthur',
    sobrenome: 'Domingues',
    email: `arthur.domingues@${DOMINIO_FICTICIO}`,
    telefone: null,
    chaveProfessor: PROFESSORES_DEMO[1].chave,
    diasAula: ['QUARTA', 'SEXTA'],
    horaInicial: '08:00',
    horaFinal: '08:40'
  },
  {
    chave: 'aluno8',
    nome: 'Valentina',
    sobrenome: 'Siqueira',
    email: `valentina.siqueira@${DOMINIO_FICTICIO}`,
    telefone: null,
    chaveProfessor: PROFESSORES_DEMO[2].chave,
    diasAula: ['SEGUNDA', 'QUARTA'],
    horaInicial: '09:00',
    horaFinal: '09:40'
  }
]);

const livro = (nome, idioma, nivel, ativo = true) => ({ nome, idioma, nivel, ativo });

/** Catálogo de 20 livros, 18 ativos e 2 fora de catálogo.
 * @type {ReadonlyArray<Readonly<LivroDemo>>}
 */
export const LIVROS_DEMO = congelar([
  livro('English Foundations 1', 'INGLES', 1),
  livro('English Foundations 2', 'INGLES', 2),
  livro('English Essentials 3', 'INGLES', 3),
  livro('English Essentials 4', 'INGLES', 4),
  livro('English Intermediate 5', 'INGLES', 5),
  livro('English Intermediate 6', 'INGLES', 6),
  livro('English Advanced 7', 'INGLES', 7),
  livro('English Mastery 8', 'INGLES', 8, false),
  livro('Espanhol Básico 1', 'ESPANHOL', 1),
  livro('Espanhol Básico 2', 'ESPANHOL', 2),
  livro('Espanhol Intermediário 3', 'ESPANHOL', 3),
  livro('Espanhol Intermediário 4', 'ESPANHOL', 4),
  livro('Espanhol Avançado 5', 'ESPANHOL', 5),
  livro('Espanhol Avançado 6', 'ESPANHOL', 6, false),
  livro('Espanhol Conversação', 'ESPANHOL', null),
  livro('Francês Iniciante 1', 'FRANCES', 1),
  livro('Francês Iniciante 2', 'FRANCES', 2),
  livro('Francês Intermediário 3', 'FRANCES', 3),
  livro('Francês Avançado 4', 'FRANCES', 4),
  livro('Francês para Negócios', 'FRANCES', null)
]);
