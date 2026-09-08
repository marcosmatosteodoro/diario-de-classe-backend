import {
  aulaConsomeConteudo,
  aulaTemConteudoCongelado,
  STATUS_CONSOME_CONTEUDO,
  TIPO_CONSOME_CONTEUDO
} from '../../../src/utilities/cronogramaRules.js';

describe('cronogramaRules', () => {
  describe('aulaConsomeConteudo', () => {
    it.each(STATUS_CONSOME_CONTEUDO)('status %s com tipo PADRAO consome conteúdo', status => {
      expect(aulaConsomeConteudo({ status, tipo: 'PADRAO' })).toBe(true);
    });

    it.each(TIPO_CONSOME_CONTEUDO)('tipo %s com status AGENDADA consome conteúdo', tipo => {
      expect(aulaConsomeConteudo({ status: 'AGENDADA', tipo })).toBe(true);
    });

    it('aula cancelada não consome conteúdo', () => {
      expect(aulaConsomeConteudo({ status: 'CANCELADA', tipo: 'PADRAO' })).toBe(false);
    });

    it('falta não consome conteúdo, para o conteúdo escorregar para a próxima aula', () => {
      expect(aulaConsomeConteudo({ status: 'CANCELADA_POR_FALTA', tipo: 'PADRAO' })).toBe(false);
    });

    it('aula do tipo OUTRA não consome conteúdo', () => {
      expect(aulaConsomeConteudo({ status: 'AGENDADA', tipo: 'OUTRA' })).toBe(false);
    });

    it('reposição consome conteúdo, porque repõe o conteúdo perdido', () => {
      expect(aulaConsomeConteudo({ status: 'AGENDADA', tipo: 'REPOSICAO' })).toBe(true);
    });

    it('aula ausente não consome conteúdo', () => {
      expect(aulaConsomeConteudo(null)).toBe(false);
      expect(aulaConsomeConteudo(undefined)).toBe(false);
    });
  });

  describe('aulaTemConteudoCongelado', () => {
    it('aula concluída está congelada: o conteúdo coberto é fato histórico', () => {
      expect(aulaTemConteudoCongelado({ status: 'CONCLUIDA', conteudoManual: false })).toBe(true);
    });

    it('escolha manual do professor está congelada', () => {
      expect(aulaTemConteudoCongelado({ status: 'AGENDADA', conteudoManual: true })).toBe(true);
    });

    it('aula agendada sem escolha manual não está congelada', () => {
      expect(aulaTemConteudoCongelado({ status: 'AGENDADA', conteudoManual: false })).toBe(false);
    });

    it('aula ausente não está congelada', () => {
      expect(aulaTemConteudoCongelado(null)).toBe(false);
    });
  });
});
