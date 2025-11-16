import { GetConfiguracaoListService } from '../../../../src/services/configuracao/getConfiguracaoService.js';

describe('GetConfiguracaoListService (unit)', () => {
  test('execute calls repository.selectMany with select and where and returns result', async () => {
    const where = { tolerancia: 5 };

    class MockRepository {
      constructor() {
        this.selectFields = { id: true };
        this.selectManyCalls = [];
      }
      async selectMany(options) {
        this.selectManyCalls.push(options);
        return [{ id: 'cfg-1', tolerancia: 5 }];
      }
    }

    const service = new GetConfiguracaoListService(MockRepository, where);
    const result = await service.execute();

    expect(result).toEqual([{ id: 'cfg-1', tolerancia: 5 }]);
    expect(service.repository.selectManyCalls).toHaveLength(1);
    const call = service.repository.selectManyCalls[0];
    expect(call.select).toBe(service.repository.selectFields);
    expect(call.where).toBe(where);
  });

  test('execute propagates repository errors', async () => {
    const err = new Error('select-fail');
    class MockRepository {
      async selectMany() {
        throw err;
      }
    }

    const service = new GetConfiguracaoListService(MockRepository, {});
    await expect(service.execute()).rejects.toThrow('select-fail');
  });

  test('static handle exists and is async', () => {
    expect(typeof GetConfiguracaoListService.handle).toBe('function');
    expect(GetConfiguracaoListService.handle.constructor.name).toBe('AsyncFunction');
  });
});
