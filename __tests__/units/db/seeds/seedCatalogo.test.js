import {
  ALUNOS_DEMO,
  CONTAS_FIXAS_DEMO,
  LIVROS_DEMO,
  PROFESSORES_DEMO
} from '../../../../src/db/seeds/seedCatalogo.js';

const minutos = hhmm => {
  const [h, m] = hhmm.split(':');
  return Number(h) * 60 + Number(m);
};

const strings = valor => {
  if (typeof valor === 'string') return [valor];
  if (Array.isArray(valor)) return valor.flatMap(strings);
  if (valor && typeof valor === 'object') return Object.values(valor).flatMap(strings);
  return [];
};

const catalogo = () => ({
  contas: CONTAS_FIXAS_DEMO,
  professores: PROFESSORES_DEMO,
  alunos: ALUNOS_DEMO,
  livros: LIVROS_DEMO
});

const registros = c => [...c.contas, ...c.professores, ...c.alunos];

const emailsForaDoPadrao = c =>
  registros(c).filter(r => r.email !== undefined && !/^[^@\s]+@example\.com$/.test(r.email));
const valoresComMarca = c => strings(c).filter(v => /bls/i.test(v));
const telefonesReais = c =>
  registros(c).filter(r => r.telefone !== undefined && r.telefone !== null);

const copia = () => JSON.parse(JSON.stringify(catalogo()));

describe('seedCatalogo', () => {
  const fixa = CONTAS_FIXAS_DEMO.find(c => c.email === 'professor.demo@example.com');
  const alunosDaFixa = ALUNOS_DEMO.filter(a => a.chaveProfessor === fixa.chave);
  const alunosNaoFixos = ALUNOS_DEMO.filter(a => a.chaveProfessor !== fixa.chave);

  it('tem as duas contas fixas com permissão e sem reset de senha', () => {
    expect(CONTAS_FIXAS_DEMO).toHaveLength(2);
    const admin = CONTAS_FIXAS_DEMO.find(c => c.email === 'admin.demo@example.com');
    expect(admin.permissao).toBe('admin');
    expect(fixa.permissao).toBe('member');
    for (const conta of CONTAS_FIXAS_DEMO) {
      expect(conta.resetarSenha).toBe(false);
      expect(conta.email).toBe(conta.email.toLowerCase());
    }
  });

  it('tem 3 professores não fixos member, 8 alunos e 20 livros de nomes únicos', () => {
    expect(PROFESSORES_DEMO).toHaveLength(3);
    PROFESSORES_DEMO.forEach(p => expect(p.permissao).toBe('member'));
    expect(ALUNOS_DEMO).toHaveLength(8);
    expect(LIVROS_DEMO).toHaveLength(20);
    expect(new Set(LIVROS_DEMO.map(l => l.nome)).size).toBe(20);
  });

  it('tem 18 livros ativos e 2 fora de catálogo, com os nomes literais', () => {
    expect(LIVROS_DEMO.filter(l => l.ativo)).toHaveLength(18);
    expect(LIVROS_DEMO.filter(l => !l.ativo).map(l => l.nome)).toEqual([
      'English Mastery 8',
      'Espanhol Avançado 6'
    ]);
  });

  it('congela os arrays do catálogo e seus itens em profundidade', () => {
    expect(() => LIVROS_DEMO.push({})).toThrow(TypeError);
    expect(() => {
      LIVROS_DEMO[0].ativo = false;
    }).toThrow(TypeError);
    expect(() => {
      ALUNOS_DEMO[0].diasAula.push('SABADO');
    }).toThrow(TypeError);
    expect(() => {
      ALUNOS_DEMO[0].nome = 'X';
    }).toThrow(TypeError);
    expect(() => {
      CONTAS_FIXAS_DEMO[0].email = 'x@gmail.com';
    }).toThrow(TypeError);
    expect(() => {
      PROFESSORES_DEMO[0].nome = 'X';
    }).toThrow(TypeError);
  });

  it('dá aos 4 alunos do professor fixo os dias literais', () => {
    expect(alunosDaFixa.map(a => a.diasAula)).toEqual([
      ['SEGUNDA', 'QUARTA'],
      ['TERCA', 'QUINTA'],
      ['QUARTA', 'SEXTA'],
      ['SEGUNDA', 'SEXTA']
    ]);
  });

  it('distribui os 4 alunos não fixos entre os 3 professores, na ordem', () => {
    expect(alunosNaoFixos).toHaveLength(4);
    expect(alunosNaoFixos.map(a => a.chaveProfessor)).toEqual([
      PROFESSORES_DEMO[0].chave,
      PROFESSORES_DEMO[0].chave,
      PROFESSORES_DEMO[1].chave,
      PROFESSORES_DEMO[2].chave
    ]);
    expect(new Set(alunosNaoFixos.map(a => a.chaveProfessor)).size).toBe(3);
  });

  it('usa slots de 40 minutos dentro de 08:00-12:00', () => {
    for (const aluno of ALUNOS_DEMO) {
      expect(minutos(aluno.horaFinal) - minutos(aluno.horaInicial)).toBe(40);
      expect(aluno.horaInicial >= '08:00').toBe(true);
      expect(aluno.horaFinal <= '12:00').toBe(true);
    }
  });

  it('não sobrepõe alunos do professor fixo nos dias em comum', () => {
    for (let i = 0; i < alunosDaFixa.length; i++) {
      for (let j = i + 1; j < alunosDaFixa.length; j++) {
        const a = alunosDaFixa[i];
        const b = alunosDaFixa[j];
        if (!a.diasAula.some(d => b.diasAula.includes(d))) continue;
        const disjuntos =
          minutos(a.horaFinal) <= minutos(b.horaInicial) ||
          minutos(b.horaFinal) <= minutos(a.horaInicial);
        expect(disjuntos).toBe(true);
      }
    }
  });

  describe('privacidade', () => {
    it('nenhum e-mail fora de example.com (com controle positivo)', () => {
      expect(emailsForaDoPadrao(catalogo())).toHaveLength(0);
      const adulterado = copia();
      adulterado.alunos[0].email = 'x@gmail.com';
      expect(emailsForaDoPadrao(adulterado)).toHaveLength(1);
    });

    it('nenhuma marca real nos valores (com controle positivo)', () => {
      expect(valoresComMarca(catalogo())).toHaveLength(0);
      const adulterado = copia();
      adulterado.professores[0].sobrenome = 'Escola BLS Idiomas';
      expect(valoresComMarca(adulterado)).toHaveLength(1);
    });

    it('nenhum telefone preenchido (com controle positivo)', () => {
      expect(telefonesReais(catalogo())).toHaveLength(0);
      const adulterado = copia();
      adulterado.alunos[0].telefone = '11987654321';
      expect(telefonesReais(adulterado)).toHaveLength(1);
    });
  });
});
