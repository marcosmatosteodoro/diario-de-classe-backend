import {
  diaCivilSaoPaulo,
  diaDaSemana,
  paraDataAula,
  somarDias
} from '../../../../src/db/seeds/seedCalendario.js';

describe('seedCalendario', () => {
  describe('diaCivilSaoPaulo', () => {
    it.each([
      ['23h30 de São Paulo ainda é o mesmo dia', '2026-03-10T23:30:00-03:00', '2026-03-10'],
      ['00h30 de São Paulo já é o dia seguinte', '2026-03-11T00:30:00-03:00', '2026-03-11'],
      ['mesmo instante do 23h30, escrito em Z', '2026-03-11T02:30:00Z', '2026-03-10'],
      ['meio da manhã de sexta', '2026-11-20T10:00:00-03:00', '2026-11-20']
    ])('%s', (_descricao, instante, esperado) => {
      expect(diaCivilSaoPaulo(new Date(instante))).toBe(esperado);
    });

    it('lança RangeError para instante inválido', () => {
      expect(() => diaCivilSaoPaulo(new Date('x'))).toThrow(RangeError);
    });
  });

  describe('somarDias', () => {
    it.each([
      ['2028-02-28', 1, '2028-02-29'],
      ['2028-02-29', 1, '2028-03-01'],
      ['2026-12-31', 1, '2027-01-01'],
      ['2026-11-30', 1, '2026-12-01'],
      ['2026-03-01', -1, '2026-02-28'],
      ['2026-11-20', -45, '2026-10-06'],
      ['2026-11-20', 180, '2027-05-19']
    ])('%s %i dia(s) → %s', (ymd, n, esperado) => {
      expect(somarDias(ymd, n)).toBe(esperado);
    });

    it('lança RangeError para dia civil fora do formato', () => {
      expect(() => somarDias('20/11/2026', 1)).toThrow(RangeError);
    });
  });

  describe('diaDaSemana', () => {
    it.each([
      ['2026-11-18', 'QUARTA'],
      ['2026-11-19', 'QUINTA'],
      ['2026-11-20', 'SEXTA'],
      ['2026-11-21', 'SABADO'],
      ['2026-11-22', 'DOMINGO'],
      ['2026-11-23', 'SEGUNDA'],
      ['2026-11-24', 'TERCA']
    ])('%s → %s', (ymd, esperado) => {
      expect(diaDaSemana(ymd)).toBe(esperado);
    });
  });

  describe('paraDataAula', () => {
    it('devolve meia-noite UTC do dia civil', () => {
      expect(paraDataAula('2026-11-20').toISOString()).toBe('2026-11-20T00:00:00.000Z');
    });
  });
});
