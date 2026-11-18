import { readFileSync, readdirSync } from 'node:fs';
import { jest } from '@jest/globals';
import { coletarCreateServices } from '../../../mocks/coletorCreateServices.js';
import { executarEtapas } from '../../../../src/db/seeds/seedEtapas.js';
import { ConfiguracaoEscolaSeed } from '../../../../src/db/seeds/models/configuracaoEscolaSeed.js';
import { AlunosSeed } from '../../../../src/db/seeds/models/alunosSeed.js';
import { gerarAgenda } from '../../../../src/db/seeds/gerarAgenda.js';
import { ALUNOS_DEMO, CONTAS_FIXAS_DEMO } from '../../../../src/db/seeds/seedCatalogo.js';
import { UpdateAulasContratoService } from '../../../../src/services/contrato/updateAulasContratoService.js';
import { GetAulaListService } from '../../../../src/services/aula/getAulaListService.js';
import { ResequenciarCronogramaService } from '../../../../src/services/cronograma/resequenciarCronogramaService.js';
import ContratoRepository from '../../../../src/repositories/contratoRepository.js';

const HOJE = '2026-11-20';
const SENHA = 'senha-sentinela-etapas';

const diasDoBoot = () =>
  ['SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO', 'DOMINGO'].map(diaSemana => ({
    id: `dia-${diaSemana}`,
    diaSemana,
    horaInicial: '08:00',
    horaFinal: '18:00',
    ativo: !['SABADO', 'DOMINGO'].includes(diaSemana)
  }));

const NOME_POR_NUMERO = ['DOMINGO', 'SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO'];

describe('executarEtapas', () => {
  let coletor;
  let configuracaoSpy;
  let recalculoSpy;

  const instalar = opcoes => {
    coletor = coletarCreateServices(opcoes);
    configuracaoSpy = jest
      .spyOn(ConfiguracaoEscolaSeed, 'handle')
      .mockImplementation(async () => ({ configuracoes: 1, dias: diasDoBoot() }));
    recalculoSpy = jest
      .spyOn(UpdateAulasContratoService, 'handle')
      .mockImplementation(async id => ({ id }));
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('com os Create*Service dublados', () => {
    beforeEach(() => instalar());

    test('cria todas as entidades, uma chamada por registro, na ordem das etapas', async () => {
      const agenda = gerarAgenda(HOJE, ALUNOS_DEMO);

      const contagens = await executarEtapas({ hoje: HOJE, senha: SENHA });

      expect(agenda.aulas.length).toBeGreaterThanOrEqual(144);
      expect(agenda.aulas.length).toBeLessThanOrEqual(152);
      expect(contagens).toEqual({
        professores: 5,
        disponibilidadeProfessores: 35,
        alunos: 8,
        contratos: 8,
        diaAulas: 16,
        livros: 20,
        configuracoes: 1,
        aulas: agenda.aulas.length
      });

      const { spies } = coletor;
      expect(spies.usuario).toHaveBeenCalledTimes(contagens.professores);
      expect(spies.disponibilidade).toHaveBeenCalledTimes(contagens.disponibilidadeProfessores);
      expect(spies.aluno).toHaveBeenCalledTimes(contagens.alunos);
      expect(spies.contrato).toHaveBeenCalledTimes(contagens.contratos);
      expect(spies.diaAula).toHaveBeenCalledTimes(contagens.diaAulas);
      expect(spies.aula).toHaveBeenCalledTimes(contagens.aulas);
      expect(spies.livro).toHaveBeenCalledTimes(contagens.livros);

      const primeira = spy => spy.mock.invocationCallOrder[0];
      const ordem = [
        configuracaoSpy,
        spies.usuario,
        spies.disponibilidade,
        spies.aluno,
        spies.contrato,
        spies.diaAula,
        spies.aula,
        recalculoSpy,
        spies.livro
      ].map(primeira);
      expect(ordem).toEqual([...ordem].sort((a, b) => a - b));
      expect(new Set(ordem).size).toBe(ordem.length);
    });

    test('recalcula os totais uma vez por contrato criado, depois da última aula', async () => {
      expect(recalculoSpy).toHaveBeenCalledTimes(0);

      await executarEtapas({ hoje: HOJE, senha: SENHA });

      const idsCriados = await Promise.all(coletor.spies.contrato.mock.results.map(r => r.value));
      const idsRecalculados = recalculoSpy.mock.calls.map(([id]) => id);
      expect(recalculoSpy).toHaveBeenCalledTimes(8);
      expect(new Set(idsRecalculados).size).toBe(8);
      expect(idsRecalculados).toEqual(idsCriados.map(c => c.id));

      const ordemAulas = coletor.spies.aula.mock.invocationCallOrder;
      expect(recalculoSpy.mock.invocationCallOrder[0]).toBeGreaterThan(
        ordemAulas[ordemAulas.length - 1]
      );
    });

    test('contratos criados ATIVOS com as datas relativas a hoje', async () => {
      await executarEtapas({ hoje: HOJE, senha: SENHA });

      expect(coletor.argumentos.contrato).toHaveLength(8);
      for (const contrato of coletor.argumentos.contrato) {
        expect(contrato.status).toBe('ATIVO');
        expect(contrato.dataInicio.toISOString()).toBe('2026-10-06T00:00:00.000Z');
        expect(contrato.dataTermino.toISOString()).toBe('2027-05-19T00:00:00.000Z');
      }
    });

    test.each(['2026-11-20', '2026-11-21', '2026-11-22'])(
      'disponibilidade e aulas só em dia ativo, dentro do horário do professor (hoje %s)',
      async hoje => {
        await executarEtapas({ hoje, senha: SENHA });

        const porProfessor = new Map();
        for (const d of coletor.argumentos.disponibilidade) {
          porProfessor.set(d.userId, [...(porProfessor.get(d.userId) ?? []), d]);
        }
        expect(coletor.argumentos.disponibilidade).toHaveLength(35);
        expect(porProfessor.size).toBe(5);
        for (const linhas of porProfessor.values()) {
          expect(linhas.map(l => l.diaSemana)).toHaveLength(7);
          for (const l of linhas) {
            const util = ['SABADO', 'DOMINGO'].includes(l.diaSemana) === false;
            expect(l.ativo).toBe(util);
            expect(l.horaInicial).toBe('08:00');
            expect(l.horaFinal).toBe('12:00');
          }
        }

        const ativosDoBoot = new Set(
          diasDoBoot()
            .filter(d => d.ativo)
            .map(d => d.diaSemana)
        );
        expect(coletor.argumentos.aula.length).toBeGreaterThan(0);
        for (const aula of coletor.argumentos.aula) {
          const dia = NOME_POR_NUMERO[aula.dataAula.getUTCDay()];
          const disponivel = porProfessor
            .get(aula.idProfessor)
            .filter(l => l.ativo)
            .map(l => l.diaSemana);
          expect(disponivel).toContain(dia);
          expect(ativosDoBoot.has(dia)).toBe(true);
          expect(aula.horaInicial >= '08:00').toBe(true);
          expect(aula.horaFinal <= '12:00').toBe(true);
        }
      }
    );

    test('toda chave de ligação gravada aponta ao registro criado a que pertence', async () => {
      await executarEtapas({ hoje: HOJE, senha: SENHA });

      const { argumentos, spies } = coletor;
      const devolvidos = async tipo => Promise.all(spies[tipo].mock.results.map(r => r.value));
      const alunos = await devolvidos('aluno');
      const usuarios = await devolvidos('usuario');
      const idsAlunos = alunos.map(a => a.id);
      const contratos = await devolvidos('contrato');
      const idsContratos = contratos.map(c => c.id);
      const contratoPorId = new Map(contratos.map(c => [c.id, c]));

      expect(contratos).toHaveLength(8);
      expect(new Set(contratos.map(c => c.idAluno)).size).toBe(8);
      for (const contrato of contratos) expect(idsAlunos).toContain(contrato.idAluno);

      expect(argumentos.diaAula).toHaveLength(16);
      const diasPorContrato = new Map();
      for (const dia of argumentos.diaAula) {
        expect(idsContratos).toContain(dia.idContrato);
        expect(contratoPorId.get(dia.idContrato).idAluno).toBe(dia.idAluno);
        expect(typeof dia.diaSemana).toBe('string');
        expect(dia.horaInicial).toMatch(/^\d{2}:\d{2}$/);
        expect(dia.horaFinal).toMatch(/^\d{2}:\d{2}$/);
        diasPorContrato.set(dia.idContrato, [...(diasPorContrato.get(dia.idContrato) ?? []), dia]);
      }
      expect(diasPorContrato.size).toBe(8);
      for (const dias of diasPorContrato.values()) expect(dias).toHaveLength(2);

      expect(argumentos.aula.length).toBeGreaterThan(0);
      const professorPorAluno = new Map();
      for (const aula of argumentos.aula) {
        const contrato = contratoPorId.get(aula.idContrato);
        expect(contrato).toBeDefined();
        expect(contrato.idAluno).toBe(aula.idAluno);

        const diaSemana = NOME_POR_NUMERO[aula.dataAula.getUTCDay()];
        const dia = diasPorContrato.get(aula.idContrato).find(d => d.diaSemana === diaSemana);
        expect(dia).toBeDefined();
        expect(aula.horaInicial).toBe(dia.horaInicial);
        expect(aula.horaFinal).toBe(dia.horaFinal);

        expect(professorPorAluno.get(aula.idAluno) ?? aula.idProfessor).toBe(aula.idProfessor);
        professorPorAluno.set(aula.idAluno, aula.idProfessor);
      }

      const idDeConta = email => {
        const i = argumentos.usuario.findIndex(u => u.email === email);
        expect(i).toBeGreaterThanOrEqual(0);
        return usuarios[i].id;
      };
      const idProfessorFixo = idDeConta('professor.demo@example.com');
      const idAdmin = idDeConta('admin.demo@example.com');
      const alunosDoFixo = [...professorPorAluno].filter(([, p]) => p === idProfessorFixo);
      expect(alunosDoFixo).toHaveLength(4);
      expect(professorPorAluno.size).toBe(8);
      expect([...professorPorAluno.values()]).not.toContain(idAdmin);
    });

    test('falha alto quando o seed de alunos devolve menos registros que o catálogo', async () => {
      const original = AlunosSeed.handle.bind(AlunosSeed);
      jest.spyOn(AlunosSeed, 'handle').mockImplementation(async () => {
        const criados = await original();
        return criados.slice(0, 7);
      });

      await expect(executarEtapas({ hoje: HOJE, senha: SENHA })).rejects.toThrow(/alunos/);
      expect(coletor.spies.contrato).toHaveBeenCalledTimes(0);
    });

    test('caso íntegro do mesmo cenário resolve e chama o contrato 8 vezes', async () => {
      await expect(executarEtapas({ hoje: HOJE, senha: SENHA })).resolves.toBeDefined();
      expect(coletor.spies.contrato).toHaveBeenCalledTimes(8);
    });

    test('catálogo congelado não é mutado: duas execuções seguidas no mesmo processo', async () => {
      const primeiro = await executarEtapas({ hoje: HOJE, senha: SENHA });
      coletor.restaurar();
      jest.restoreAllMocks();
      instalar();
      const segundo = await executarEtapas({ hoje: HOJE, senha: SENHA });

      expect(segundo).toEqual(primeiro);
      expect(Object.isFrozen(ALUNOS_DEMO[0])).toBe(true);
      expect(Object.isFrozen(CONTAS_FIXAS_DEMO[0])).toBe(true);
      expect(Object.hasOwn(ALUNOS_DEMO[0], 'id')).toBe(false);
    });
  });

  describe('com o UpdateAulasContratoService real', () => {
    let updates;

    beforeEach(() => {
      coletor = coletarCreateServices();
      jest
        .spyOn(ConfiguracaoEscolaSeed, 'handle')
        .mockImplementation(async () => ({ configuracoes: 1, dias: diasDoBoot() }));
      updates = [];
      jest
        .spyOn(GetAulaListService, 'handle')
        .mockImplementation(async ({ idContrato }) =>
          coletor.argumentos.aula.filter(a => a.idContrato === idContrato)
        );
      jest.spyOn(ContratoRepository.prototype, 'update').mockImplementation(async (where, data) => {
        updates.push({ id: where.id, data });
        return { id: where.id, ...data };
      });
      jest.spyOn(ResequenciarCronogramaService, 'handle').mockImplementation(async () => {});
    });

    test('totais de cada contrato: valores literais e contagem independente do futuro', async () => {
      await executarEtapas({ hoje: HOJE, senha: SENHA });

      const idsCriados = await Promise.all(coletor.spies.contrato.mock.results.map(r => r.value));
      expect(updates).toHaveLength(8);

      const inicio = Date.UTC(2026, 10, 20);
      ALUNOS_DEMO.forEach((aluno, i) => {
        const numeros = aluno.diasAula.map(d => NOME_POR_NUMERO.indexOf(d));
        let futuras = 0;
        for (let k = 0; k <= 35; k += 1) {
          if (numeros.includes(new Date(inicio + k * 86400000).getUTCDay())) futuras += 1;
        }

        const { data } = updates.find(u => u.id === idsCriados[i].id);
        expect(data.totalAulasFeitas).toBe(6);
        expect(data.totalFaltas).toBe(1);
        expect(data.totalAulasCanceladas).toBe(1);
        expect(data.totalReposicoes).toBe(1);
        expect(data.totalAulas).toBe(8 + futuras);
      });
    });
  });

  test('nenhum arquivo do seed lê process.env', () => {
    const arquivos = readdirSync('src/db/seeds', { recursive: true, withFileTypes: true })
      .filter(e => e.isFile() && e.name.endsWith('.js'))
      .map(e => `${e.parentPath}/${e.name}`);
    expect(arquivos.length).toBeGreaterThan(10);
    const comEnv = arquivos.filter(a =>
      readFileSync(a, 'utf8')
        .split('\n')
        .some(l => /^[^/*]*process\.env/.test(l))
    );
    expect(/^[^/*]*process\.env/.test('const x = process.env.X')).toBe(true);
    expect(comEnv).toEqual([]);
  });
});
