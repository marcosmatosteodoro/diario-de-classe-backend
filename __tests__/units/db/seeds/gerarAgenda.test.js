import { gerarAgenda } from '../../../../src/db/seeds/gerarAgenda.js';
import { ALUNOS_DEMO, CONTAS_FIXAS_DEMO } from '../../../../src/db/seeds/seedCatalogo.js';
import {
  diaCivilSaoPaulo,
  diaDaSemana,
  paraDataAula,
  somarDias
} from '../../../../src/db/seeds/seedCalendario.js';

const MATRIZ_HOJE = [
  '2026-11-20',
  '2026-11-21',
  '2026-11-22',
  '2026-11-30',
  '2028-02-29',
  '2026-12-31',
  diaCivilSaoPaulo(new Date('2026-03-10T23:30:00-03:00')),
  diaCivilSaoPaulo(new Date('2026-03-11T00:30:00-03:00'))
];

const REGISTRADOS = ['CONCLUIDA', 'CANCELADA', 'CANCELADA_POR_FALTA'];
const DIAS_UTEIS = ['SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA'];

const dia = aula => aula.dataAula.toISOString().slice(0, 10);
const chaveProfessorFixo = CONTAS_FIXAS_DEMO.find(
  c => c.email === 'professor.demo@example.com'
).chave;
const doProfessorFixo = aulas => aulas.filter(a => a.chaveProfessor === chaveProfessorFixo);

const passadasAgendadas = (aulas, hoje) =>
  aulas.filter(a => dia(a) < hoje && a.status === 'AGENDADA');
const futurasRegistradas = (aulas, hoje) =>
  aulas.filter(a => dia(a) >= hoje && a.status !== 'AGENDADA');

const diasDistintos = (aulas, de, ate, predicado) =>
  new Set(aulas.filter(a => dia(a) >= de && dia(a) <= ate && predicado(a)).map(dia)).size;

const registrada = a => REGISTRADOS.includes(a.status);
const agendada = a => a.status === 'AGENDADA';

const aulasEmFimDeSemana = aulas =>
  aulas.filter(a => ['SABADO', 'DOMINGO'].includes(diaDaSemana(dia(a))));
const duplicadasPorAlunoEDia = aulas =>
  aulas.length - new Set(aulas.map(a => `${a.chaveAluno}|${dia(a)}`)).size;

const aulasOrfas = (aulas, diasAula) =>
  aulas.filter(a => {
    const casados = diasAula.filter(
      d =>
        d.chaveAluno === a.chaveAluno &&
        d.diaSemana === diaDaSemana(dia(a)) &&
        d.horaInicial === a.horaInicial &&
        d.horaFinal === a.horaFinal
    );
    return casados.length !== 1;
  });

const futurasReposicao = (aulas, hoje) =>
  aulas.filter(a => dia(a) >= hoje && a.tipo === 'REPOSICAO');

describe('gerarAgenda', () => {
  describe.each(MATRIZ_HOJE)('hoje = %s', hoje => {
    const { contratos, diasAula, aulas } = gerarAgenda(hoje, ALUNOS_DEMO);

    it('liga cada aula a exatamente 1 diaAula gerado (chave, dia da semana e horário)', () => {
      expect(aulas.length).toBeGreaterThan(0);
      expect(aulasOrfas(aulas, diasAula)).toHaveLength(0);
    });

    it('aponta aula órfã quando o diaSemana gerado é adulterado (controle positivo)', () => {
      const adulterado = diasAula.map(d => ({ ...d }));
      adulterado[0].diaSemana = adulterado[0].diaSemana === 'SABADO' ? 'DOMINGO' : 'SABADO';
      expect(aulasOrfas(aulas, adulterado).length).toBeGreaterThanOrEqual(1);
    });

    it('gera por aluno exatamente os diasAula do catálogo, com quantidadeAulas 1', () => {
      for (const aluno of ALUNOS_DEMO) {
        const geradosDoAluno = diasAula.filter(d => d.chaveAluno === aluno.chave);
        expect(geradosDoAluno.map(d => d.diaSemana).sort()).toEqual([...aluno.diasAula].sort());
        expect(geradosDoAluno).toHaveLength(aluno.diasAula.length);
      }
      expect(diasAula).toHaveLength(ALUNOS_DEMO.reduce((n, a) => n + a.diasAula.length, 0));
      diasAula.forEach(d => expect(d.quantidadeAulas).toBe(1));
    });

    it('gera os contratos na ordem literal dos alunos', () => {
      expect(contratos.map(c => c.chaveAluno)).toEqual(ALUNOS_DEMO.map(a => a.chave));
    });

    it('gera um contrato ATIVO vigente por aluno', () => {
      expect(contratos).toHaveLength(ALUNOS_DEMO.length);
      for (const contrato of contratos) {
        expect(contrato.status).toBe('ATIVO');
        expect(contrato.dataInicio <= paraDataAula(somarDias(hoje, -30))).toBe(true);
        expect(contrato.dataTermino >= paraDataAula(somarDias(hoje, 90))).toBe(true);
      }
    });

    it('registra só o passado e agenda só de hoje em diante', () => {
      expect(passadasAgendadas(aulas, hoje)).toHaveLength(0);
      expect(futurasRegistradas(aulas, hoje)).toHaveLength(0);
      for (const aula of aulas) {
        if (dia(aula) < hoje) {
          expect(REGISTRADOS).toContain(aula.status);
        } else {
          expect(aula.status).toBe('AGENDADA');
          expect(aula.tipo).toBe('PADRAO');
        }
      }
      expect(aulas.filter(a => dia(a) < hoje).length).toBeGreaterThanOrEqual(1);
      expect(aulas.filter(a => dia(a) >= hoje).length).toBeGreaterThanOrEqual(1);
    });

    it('aponta o estado incoerente quando adulterado (controle positivo)', () => {
      const adulteradas = aulas.map(a => ({ ...a }));
      adulteradas.find(a => dia(a) < hoje).status = 'AGENDADA';
      adulteradas.find(a => dia(a) >= hoje).status = 'CONCLUIDA';
      expect(passadasAgendadas(adulteradas, hoje)).toHaveLength(1);
      expect(futurasRegistradas(adulteradas, hoje)).toHaveLength(1);
    });

    it('cumpre o piso observável do professor fixo', () => {
      const aulasFixo = doProfessorFixo(aulas);
      const alunosFixo = ALUNOS_DEMO.filter(a => a.chaveProfessor === chaveProfessorFixo);

      expect(
        diasDistintos(aulasFixo, somarDias(hoje, -14), somarDias(hoje, -1), registrada)
      ).toBeGreaterThanOrEqual(4);
      expect(diasDistintos(aulasFixo, hoje, somarDias(hoje, 28), agendada)).toBeGreaterThanOrEqual(
        8
      );
      expect(new Set(aulasFixo.map(a => a.chaveAluno)).size).toBe(4);
      expect(new Set(alunosFixo.flatMap(a => a.diasAula))).toEqual(new Set(DIAS_UTEIS));

      const aulasDeHoje = aulasFixo.filter(a => dia(a) === hoje);
      if (DIAS_UTEIS.includes(diaDaSemana(hoje))) {
        expect(aulasDeHoje.length).toBeGreaterThanOrEqual(1);
      } else {
        expect(aulasDeHoje).toHaveLength(0);
      }
    });
  });

  it('usa os literais de vigência para 2026-11-20', () => {
    const { contratos } = gerarAgenda('2026-11-20', ALUNOS_DEMO);
    expect(contratos[0].dataInicio.toISOString()).toBe('2026-10-06T00:00:00.000Z');
    expect(contratos[0].dataTermino.toISOString()).toBe('2027-05-19T00:00:00.000Z');
  });

  it.each([
    ['2026-11-20', 10, 21, 2],
    ['2026-11-21', 10, 20, 0],
    ['2026-11-22', 10, 20, 0]
  ])('piso literal do professor fixo em %s', (hoje, registrados, agendados, aulasHoje) => {
    const aulasFixo = doProfessorFixo(gerarAgenda(hoje, ALUNOS_DEMO).aulas);
    expect(diasDistintos(aulasFixo, somarDias(hoje, -14), somarDias(hoje, -1), registrada)).toBe(
      registrados
    );
    expect(diasDistintos(aulasFixo, hoje, somarDias(hoje, 28), agendada)).toBe(agendados);
    expect(aulasFixo.filter(a => dia(a) === hoje)).toHaveLength(aulasHoje);
  });

  describe.each(['2026-11-20', '2026-11-21', '2026-11-22'])('invariantes de dia em %s', hoje => {
    const { aulas } = gerarAgenda(hoje, ALUNOS_DEMO);

    it('só gera aula em dia útil, no dia de aula e no horário do próprio aluno', () => {
      expect(aulasEmFimDeSemana(aulas)).toHaveLength(0);
      for (const aula of aulas) {
        const aluno = ALUNOS_DEMO.find(a => a.chave === aula.chaveAluno);
        expect(DIAS_UTEIS).toContain(diaDaSemana(dia(aula)));
        expect(aluno.diasAula).toContain(diaDaSemana(dia(aula)));
        expect(aula.horaInicial).toBe(aluno.horaInicial);
        expect(aula.horaFinal).toBe(aluno.horaFinal);
        expect(aula.horaInicial >= '08:00' && aula.horaFinal <= '12:00').toBe(true);
      }
    });

    it('não repete aluno no mesmo dia (controle positivo)', () => {
      expect(duplicadasPorAlunoEDia(aulas)).toBe(0);
      expect(duplicadasPorAlunoEDia([...aulas, aulas[0]])).toBe(1);
    });

    it('aponta aula em fim de semana adulterada (controle positivo)', () => {
      const sabado = { ...aulas[0], dataAula: paraDataAula('2026-11-21') };
      expect(aulasEmFimDeSemana([...aulas, sabado])).toHaveLength(1);
    });
  });

  describe('determinismo e estados por índice', () => {
    const hoje = '2026-11-20';
    const { aulas } = gerarAgenda(hoje, ALUNOS_DEMO);

    it('duas chamadas com o mesmo hoje são iguais', () => {
      expect(gerarAgenda(hoje, ALUNOS_DEMO)).toEqual(gerarAgenda(hoje, ALUNOS_DEMO));
    });

    it('cada aluno tem 8 passadas: 1 falta, 1 cancelada, 6 concluídas, 1 reposição', () => {
      let reposicoes = 0;
      for (const aluno of ALUNOS_DEMO) {
        const passadas = aulas.filter(a => a.chaveAluno === aluno.chave && dia(a) < hoje);
        const por = status => passadas.filter(a => a.status === status).length;
        expect(passadas).toHaveLength(8);
        expect(por('CANCELADA_POR_FALTA')).toBe(1);
        expect(por('CANCELADA')).toBe(1);
        expect(por('CONCLUIDA')).toBe(6);

        const reposicao = passadas.filter(a => a.tipo === 'REPOSICAO');
        expect(reposicao).toHaveLength(1);
        expect(reposicao[0].status).toBe('CONCLUIDA');
        expect(aluno.diasAula).toContain(diaDaSemana(dia(reposicao[0])));
        reposicoes += reposicao.length;
      }
      expect(reposicoes).toBe(8);
      expect(futurasReposicao(aulas, hoje)).toHaveLength(0);
      const adulteradas = aulas.map(a => ({ ...a }));
      adulteradas.find(a => dia(a) >= hoje).tipo = 'REPOSICAO';
      expect(futurasReposicao(adulteradas, hoje)).toHaveLength(1);
    });

    it('a reposição é a 4ª passada (índice 3) de cada aluno', () => {
      for (const aluno of ALUNOS_DEMO) {
        const passadas = aulas.filter(a => a.chaveAluno === aluno.chave && dia(a) < hoje);
        expect(passadas.map(a => a.tipo === 'REPOSICAO').indexOf(true)).toBe(3);
        expect(passadas[5].status).toBe('CANCELADA_POR_FALTA');
        expect(passadas[7].status).toBe('CANCELADA');
      }
    });

    it('usa uma observação não vazia por status, diferente do texto legado', () => {
      const porStatus = {};
      for (const aula of aulas) {
        expect(typeof aula.observacao).toBe('string');
        expect(aula.observacao.length).toBeGreaterThan(0);
        expect(aula.observacao).not.toBe('vdvdsvdsvdsvdsvds');
        (porStatus[aula.status] ??= new Set()).add(aula.observacao);
      }
      expect(Object.keys(porStatus).sort()).toEqual([
        'AGENDADA',
        'CANCELADA',
        'CANCELADA_POR_FALTA',
        'CONCLUIDA'
      ]);
      Object.values(porStatus).forEach(valores => expect(valores.size).toBe(1));
    });
  });
});
