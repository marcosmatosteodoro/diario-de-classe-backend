import { SubstituirConfiguracaoService } from '../../../../src/services/configuracao/substituirConfiguracaoService.js';

describe('SubstituirConfiguracaoService (unit)', () => {
  test('execute passa ids, dados whitelisted e select ao repository', async () => {
    const calls = [];
    class MockRepository {
      constructor() {
        this.selectFields = { id: true };
      }
      async substituir(ids, data, options) {
        calls.push({ ids, data, options });
        return { id: 'novo', ...data };
      }
    }

    const service = new SubstituirConfiguracaoService(MockRepository, ['a', 'b'], {
      duracaoAula: 40,
      tolerancia: 10,
      extra: 'ignorado'
    });
    const result = await service.execute();

    expect(result).toEqual({ id: 'novo', duracaoAula: 40, tolerancia: 10 });
    expect(calls).toEqual([
      {
        ids: ['a', 'b'],
        data: { duracaoAula: 40, tolerancia: 10 },
        options: { select: { id: true } }
      }
    ]);
  });

  test('execute propaga erro do repository', async () => {
    class MockRepository {
      async substituir() {
        throw new Error('mock-fail');
      }
    }

    const service = new SubstituirConfiguracaoService(MockRepository, [], {});
    await expect(service.execute()).rejects.toThrow('mock-fail');
  });

  test('static handle is an async function', () => {
    expect(SubstituirConfiguracaoService.handle.constructor.name).toBe('AsyncFunction');
  });
});
