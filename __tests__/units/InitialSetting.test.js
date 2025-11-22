import { InitialSetting } from '../../src/InitialSetting.js';

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
});
