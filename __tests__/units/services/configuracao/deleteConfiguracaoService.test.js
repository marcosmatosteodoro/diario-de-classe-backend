import { DeleteConfiguracaoService } from '../../../../src/services/configuracao/deleteConfiguracaoService.js';

describe('DeleteConfiguracaoService (unit)', () => {
  test('execute calls repository.delete with where id and returns result', async () => {
    class MockRepository {
      constructor() {
        this.deleteCalls = [];
      }
      async delete(where, options) {
        this.deleteCalls.push({ where, options });
        return { id: where.id };
      }
    }

    const service = new DeleteConfiguracaoService(MockRepository, 'cfg-1');
    const result = await service.execute();

    expect(result).toEqual({ id: 'cfg-1' });
    expect(service.repository.deleteCalls).toHaveLength(1);
    expect(service.repository.deleteCalls[0].where).toEqual({ id: 'cfg-1' });
  });

  test('execute propagates repository errors', async () => {
    const err = new Error('mock-fail');
    class MockRepository {
      async delete() {
        throw err;
      }
    }

    const service = new DeleteConfiguracaoService(MockRepository, 'x');
    await expect(service.execute()).rejects.toThrow('mock-fail');
  });

  test('static handle is an async function', () => {
    expect(typeof DeleteConfiguracaoService.handle).toBe('function');
    expect(DeleteConfiguracaoService.handle.constructor.name).toBe('AsyncFunction');
  });
});
