import { jest } from '@jest/globals';

const getConfiguracao = jest.fn();
const createConfiguracao = jest.fn();
const substituirConfiguracao = jest.fn();
const getDias = jest.fn();
const createDia = jest.fn();
const substituirDias = jest.fn();

jest.unstable_mockModule('../../src/services/configuracao/getConfiguracaoService.js', () => ({
  GetConfiguracaoService: { handle: getConfiguracao }
}));
jest.unstable_mockModule('../../src/services/configuracao/createConfiguracaoService.js', () => ({
  CreateConfiguracaoService: { handle: createConfiguracao }
}));
jest.unstable_mockModule(
  '../../src/services/configuracao/substituirConfiguracaoService.js',
  () => ({ SubstituirConfiguracaoService: { handle: substituirConfiguracao } })
);
jest.unstable_mockModule(
  '../../src/services/diaDeFuncionamento/getDiaDeFuncionamentoListService.js',
  () => ({ GetDiaDeFuncionamentoListService: { handle: getDias } })
);
jest.unstable_mockModule(
  '../../src/services/diaDeFuncionamento/createDiaDeFuncionamentoService.js',
  () => ({ CreateDiaDeFuncionamentoService: { handle: createDia } })
);
jest.unstable_mockModule(
  '../../src/services/diaDeFuncionamento/substituirDiasDeFuncionamentoService.js',
  () => ({ SubstituirDiasDeFuncionamentoService: { handle: substituirDias } })
);

const { InitialSetting } = await import('../../src/InitialSetting.js');

const SEMANA = ['SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO', 'DOMINGO'];

describe('InitialSetting (unit)', () => {
  test('should initialize with default values', () => {
    const s = new InitialSetting();

    expect(Array.isArray(s.configuracoes)).toBe(true);
    expect(s.configuracao).toBeNull();
    expect(s.configuracaoError).toBeNull();
    expect(Array.isArray(s.dias)).toBe(true);
    expect(s.dias.length).toBe(7);
    expect(Array.isArray(s.diasDeFuncionamento)).toBe(true);
    expect(s.diaDeFuncionamentoError).toBeNull();
  });

  test('isConfiguracaoValid should mark error when more than one', () => {
    const inst = new InitialSetting();
    inst.configuracoes = [{}, {}];

    const valid = inst.isConfiguracaoValid();

    expect(valid).toBe(false);
    expect(inst.configuracaoError).toBe('maisDeUmaConfiguracao');
  });

  test('isDiaDeFuncionamentoValid should validate correct array', () => {
    const inst = new InitialSetting();
    inst.diasDeFuncionamento = inst.dias.map(d => ({ diaSemana: d }));

    const valid = inst.isDiaDeFuncionamentoValid();

    expect(valid).toBe(true);
  });

  describe('start (setup de boot)', () => {
    beforeEach(() => {
      jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    test('mais de uma configuração: substitui passando os ids lidos', async () => {
      getConfiguracao.mockResolvedValue([{ id: 'c1' }, { id: 'c2' }]);
      substituirConfiguracao.mockResolvedValue({ id: 'c3' });
      getDias.mockResolvedValue(SEMANA.map((d, i) => ({ id: `d${i}`, diaSemana: d })));

      await InitialSetting.handle();

      expect(substituirConfiguracao).toHaveBeenCalledWith(['c1', 'c2'], {
        duracaoAula: 40,
        tolerancia: 10
      });
      expect(createConfiguracao).not.toHaveBeenCalled();
    });

    test('após corrigir a configuração, os dias são relidos e criados quando ausentes', async () => {
      const ordem = [];
      getConfiguracao.mockResolvedValue([{ id: 'c1' }, { id: 'c2' }]);
      substituirConfiguracao.mockImplementation(async () => {
        ordem.push('substituirConfiguracao');
        return { id: 'c3' };
      });
      getDias.mockImplementation(async () => {
        ordem.push('getDias');
        return [];
      });
      createDia.mockImplementation(async data => ({ id: data.diaSemana, ...data }));

      await InitialSetting.handle();

      expect(ordem).toEqual(['substituirConfiguracao', 'getDias']);
      expect(createDia).toHaveBeenCalledTimes(7);
      expect(createDia.mock.calls.every(c => c[0].configuracaoId === 'c3')).toBe(true);
    });

    test('dias inválidos: substitui passando os ids lidos e a semana padrão', async () => {
      getConfiguracao.mockResolvedValue([{ id: 'c1' }]);
      getDias.mockResolvedValue([
        { id: 'd1', diaSemana: 'SEGUNDA' },
        { id: 'd2', diaSemana: 'TERCA' }
      ]);
      substituirDias.mockResolvedValue([]);

      await InitialSetting.handle();

      expect(substituirDias).toHaveBeenCalledTimes(1);
      const [ids, lista] = substituirDias.mock.calls[0];
      expect(ids).toEqual(['d1', 'd2']);
      expect(lista.map(d => d.diaSemana)).toEqual(SEMANA);
      expect(lista.every(d => d.configuracaoId === 'c1' && d.ativo === true)).toBe(true);
      expect(createDia).not.toHaveBeenCalled();
    });

    test('estado válido: nenhuma escrita', async () => {
      getConfiguracao.mockResolvedValue([{ id: 'c1' }]);
      getDias.mockResolvedValue(SEMANA.map((d, i) => ({ id: `d${i}`, diaSemana: d })));

      await InitialSetting.handle();

      expect(createConfiguracao).not.toHaveBeenCalled();
      expect(substituirConfiguracao).not.toHaveBeenCalled();
      expect(createDia).not.toHaveBeenCalled();
      expect(substituirDias).not.toHaveBeenCalled();
    });

    test('erro na substituição propaga', async () => {
      getConfiguracao.mockResolvedValue([{ id: 'c1' }, { id: 'c2' }]);
      substituirConfiguracao.mockRejectedValue(new Error('falha'));

      await expect(InitialSetting.handle()).rejects.toThrow('falha');
    });
  });
});
