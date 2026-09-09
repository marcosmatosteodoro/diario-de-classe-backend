import { jest } from '@jest/globals';
import { ResequenciarCronogramaService } from '../../../../src/services/cronograma/resequenciarCronogramaService.js';
import { GetCronogramaAtivoService } from '../../../../src/services/cronograma/getCronogramaAtivoService.js';
import AulaRepository from '../../../../src/repositories/aulaRepository.js';

/**
 * Helpers de cenário. `calcularVinculos` é função pura: recebe as aulas já
 * ordenadas por data e os conteúdos ordenados por `ordem`.
 */
const conteudo = ordem => ({ id: `conteudo-${ordem}`, ordem, titulo: `Unit ${ordem}` });

const aula = (id, overrides = {}) => ({
  id,
  dataAula: new Date(`2026-03-${String(id).padStart(2, '0')}T00:00:00.000Z`),
  horaInicial: '08:00',
  tipo: 'PADRAO',
  status: 'AGENDADA',
  idConteudo: null,
  conteudoManual: false,
  ...overrides
});

describe('ResequenciarCronogramaService', () => {
  let service;

  beforeEach(() => {
    service = new ResequenciarCronogramaService(AulaRepository, 'contrato-1');
  });

  describe('calcularVinculos', () => {
    it('distribui os conteúdos na ordem do livro pelas aulas em ordem de data', () => {
      const vinculos = service.calcularVinculos(
        [aula('01'), aula('02'), aula('03')],
        [conteudo(1), conteudo(2), conteudo(3)]
      );

      expect(vinculos.map(v => v.idConteudo)).toEqual(['conteudo-1', 'conteudo-2', 'conteudo-3']);
      expect(vinculos.every(v => v.alterado)).toBe(true);
    });

    it('aula cancelada não consome conteúdo e o conteúdo escorrega para a seguinte', () => {
      const vinculos = service.calcularVinculos(
        [aula('01'), aula('02', { status: 'CANCELADA' }), aula('03')],
        [conteudo(1), conteudo(2), conteudo(3)]
      );

      expect(vinculos.map(v => v.idConteudo)).toEqual(['conteudo-1', null, 'conteudo-2']);
    });

    it('falta não consome conteúdo: o aluno não deu aquela matéria', () => {
      const vinculos = service.calcularVinculos(
        [aula('01'), aula('02', { status: 'CANCELADA_POR_FALTA' }), aula('03')],
        [conteudo(1), conteudo(2)]
      );

      expect(vinculos.map(v => v.idConteudo)).toEqual(['conteudo-1', null, 'conteudo-2']);
    });

    it('aula do tipo OUTRA fica sem conteúdo', () => {
      const vinculos = service.calcularVinculos(
        [aula('01', { tipo: 'OUTRA' }), aula('02')],
        [conteudo(1)]
      );

      expect(vinculos.map(v => v.idConteudo)).toEqual([null, 'conteudo-1']);
    });

    it('reposição consome conteúdo', () => {
      const vinculos = service.calcularVinculos(
        [aula('01', { tipo: 'REPOSICAO' }), aula('02')],
        [conteudo(1), conteudo(2)]
      );

      expect(vinculos.map(v => v.idConteudo)).toEqual(['conteudo-1', 'conteudo-2']);
    });

    it('preserva a aula concluída e tira o conteúdo dela da fila', () => {
      const vinculos = service.calcularVinculos(
        [aula('01', { status: 'CONCLUIDA', idConteudo: 'conteudo-2' }), aula('02'), aula('03')],
        [conteudo(1), conteudo(2), conteudo(3)]
      );

      // A concluída mantém o conteúdo 2; as seguintes recebem 1 e 3, sem repetir.
      expect(vinculos.map(v => v.idConteudo)).toEqual(['conteudo-2', 'conteudo-1', 'conteudo-3']);
      expect(vinculos[0].alterado).toBe(false);
    });

    it('não atribui conteúdo retroativo a aula concluída sem vínculo', () => {
      const vinculos = service.calcularVinculos(
        [aula('01', { status: 'CONCLUIDA', idConteudo: null }), aula('02')],
        [conteudo(1), conteudo(2)]
      );

      expect(vinculos[0].idConteudo).toBeNull();
      expect(vinculos[0].alterado).toBe(false);
      expect(vinculos[1].idConteudo).toBe('conteudo-1');
    });

    it('respeita a escolha manual do professor e segue a fila depois dela', () => {
      const vinculos = service.calcularVinculos(
        [aula('01'), aula('02', { conteudoManual: true, idConteudo: 'conteudo-3' }), aula('03')],
        [conteudo(1), conteudo(2), conteudo(3)]
      );

      expect(vinculos.map(v => v.idConteudo)).toEqual(['conteudo-1', 'conteudo-3', 'conteudo-2']);
      expect(vinculos[1].alterado).toBe(false);
    });

    it('deixa aula sem conteúdo quando o livro acaba antes das aulas', () => {
      const vinculos = service.calcularVinculos(
        [aula('01'), aula('02'), aula('03')],
        [conteudo(1)]
      );

      expect(vinculos.map(v => v.idConteudo)).toEqual(['conteudo-1', null, null]);
    });

    it('não marca como alterado o vínculo que já está correto', () => {
      const vinculos = service.calcularVinculos(
        [aula('01', { idConteudo: 'conteudo-1' }), aula('02', { idConteudo: 'conteudo-2' })],
        [conteudo(1), conteudo(2)]
      );

      expect(vinculos.every(v => v.alterado)).toBe(false);
    });

    it('funciona com livro sem conteúdo cadastrado', () => {
      const vinculos = service.calcularVinculos([aula('01')], []);

      expect(vinculos.map(v => v.idConteudo)).toEqual([null]);
    });
  });

  describe('dataInicio do livro', () => {
    it('aula anterior ao início do livro não consome conteúdo dele', () => {
      // A aula pertence ao livro anterior; sem esta regra ela recebia o
      // primeiro conteúdo do livro novo.
      const vinculos = service.calcularVinculos(
        [aula('01'), aula('10'), aula('11')],
        [conteudo(1), conteudo(2)],
        new Date('2026-03-10T00:00:00.000Z')
      );

      expect(vinculos.map(v => v.idConteudo)).toEqual([null, 'conteudo-1', 'conteudo-2']);
      expect(vinculos[0].consome).toBe(false);
    });

    it('aula exatamente na data de início já pertence ao livro', () => {
      const vinculos = service.calcularVinculos(
        [aula('10')],
        [conteudo(1)],
        new Date('2026-03-10T00:00:00.000Z')
      );

      expect(vinculos[0].idConteudo).toBe('conteudo-1');
    });

    it('sem dataInicio, percorre todas as aulas (compatível com o anterior)', () => {
      const vinculos = service.calcularVinculos(
        [aula('01'), aula('10')],
        [conteudo(1), conteudo(2)],
        null
      );

      expect(vinculos.map(v => v.idConteudo)).toEqual(['conteudo-1', 'conteudo-2']);
    });
  });

  describe('montarResumo', () => {
    it('conta o conteúdo que não cabe no contrato', () => {
      const conteudos = [conteudo(1), conteudo(2), conteudo(3)];
      const vinculos = service.calcularVinculos([aula('01')], conteudos);

      expect(service.montarResumo(vinculos, conteudos)).toEqual({
        totalConteudos: 3,
        conteudosVinculados: 1,
        conteudosRestantes: 2,
        aulasSemConteudo: 0
      });
    });

    it('não fica negativo quando o contrato tem aulas de um livro anterior', () => {
      // Regressão: `vinculados` contava o conteúdo das aulas concluídas do
      // livro 1 contra o total do livro 2, dando conteudosRestantes = -1 e
      // contradizendo `conteudosNaoAgendados` na mesma resposta.
      const conteudosLivro2 = [
        { id: 'L2-c1', ordem: 1 },
        { id: 'L2-c2', ordem: 2 }
      ];
      const aulas = [
        aula('01', { status: 'CONCLUIDA', idConteudo: 'L1-c1' }),
        aula('02', { status: 'CONCLUIDA', idConteudo: 'L1-c2' }),
        aula('03')
      ];

      const vinculos = service.calcularVinculos(aulas, conteudosLivro2);

      expect(service.montarResumo(vinculos, conteudosLivro2)).toEqual({
        totalConteudos: 2,
        conteudosVinculados: 1,
        conteudosRestantes: 1,
        aulasSemConteudo: 0
      });
    });

    it('conta a aula que sobrou sem conteúdo porque o livro terminou', () => {
      const conteudos = [conteudo(1)];
      const vinculos = service.calcularVinculos([aula('01'), aula('02'), aula('03')], conteudos);

      expect(service.montarResumo(vinculos, conteudos)).toEqual({
        totalConteudos: 1,
        conteudosVinculados: 1,
        conteudosRestantes: 0,
        aulasSemConteudo: 2
      });
    });
  });

  describe('execute', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('é no-op em contrato sem livro em curso', async () => {
      jest.spyOn(GetCronogramaAtivoService, 'handle').mockResolvedValue(null);
      const selectManySpy = jest.spyOn(AulaRepository.prototype, 'selectMany');

      const resultado = await ResequenciarCronogramaService.handle('contrato-1');

      expect(resultado).toEqual({
        resequenciado: false,
        motivo: 'sem_cronograma_ativo',
        aulasAtualizadas: 0
      });
      // Não deve nem consultar as aulas: sem livro, não há o que resequenciar.
      expect(selectManySpy).not.toHaveBeenCalled();
    });
  });
});
