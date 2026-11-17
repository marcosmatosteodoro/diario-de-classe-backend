import { SubstituirDiasDeFuncionamentoService } from '../../../../src/services/diaDeFuncionamento/substituirDiasDeFuncionamentoService.js';

describe('SubstituirDiasDeFuncionamentoService (unit)', () => {
  const dia = {
    diaSemana: 'SEGUNDA',
    horaInicial: '08:00',
    horaFinal: '18:00',
    ativo: true,
    configuracaoId: 'cfg-1'
  };

  test('execute passa ids, lista whitelisted e select ao repository', async () => {
    const calls = [];
    class MockRepository {
      constructor() {
        this.selectFields = { id: true };
      }
      async substituir(ids, lista, options) {
        calls.push({ ids, lista, options });
        return lista.map((d, i) => ({ id: `n${i}`, ...d }));
      }
    }

    const service = new SubstituirDiasDeFuncionamentoService(
      MockRepository,
      ['x', 'y'],
      [{ ...dia, extra: 'ignorado' }]
    );
    const result = await service.execute();

    expect(result).toEqual([{ id: 'n0', ...dia }]);
    expect(calls).toEqual([{ ids: ['x', 'y'], lista: [dia], options: { select: { id: true } } }]);
  });

  test('execute propaga erro do repository', async () => {
    class MockRepository {
      async substituir() {
        throw new Error('mock-fail');
      }
    }

    const service = new SubstituirDiasDeFuncionamentoService(MockRepository, [], [dia]);
    await expect(service.execute()).rejects.toThrow('mock-fail');
  });

  test('static handle is an async function', () => {
    expect(SubstituirDiasDeFuncionamentoService.handle.constructor.name).toBe('AsyncFunction');
  });
});
