import { UpdateConfiguracaoService } from '../../../../src/services/configuracao/updateConfiguracaoService.js';

describe('UpdateConfiguracaoService (unit)', () => {
  test('execute calls repository.update with where, data and select, returns updated record', async () => {
    const id = 'cfg-1';
    const payload = { duracaoDaAula: 60, tolerancia: 10 };

    class MockRepository {
      constructor() {
        this.selectFields = { id: true };
        this.updateCalls = [];
      }
      async update(where, data, options) {
        this.updateCalls.push({ where, data, options });
        return { id: where.id, ...data };
      }
    }

    const service = new UpdateConfiguracaoService(MockRepository, id, payload);
    const result = await service.execute();

    expect(result).toEqual({ id, ...payload });
    expect(service.repository.updateCalls).toHaveLength(1);
    const call = service.repository.updateCalls[0];
    expect(call.where).toEqual({ id });
    expect(call.data).toEqual(payload);
    expect(call.options).toEqual({ select: service.repository.selectFields });
  });

  test('execute removes undefined fields before update', async () => {
    const id = 'cfg-2';
    const payload = { duracaoDaAula: undefined, tolerancia: 7 };

    class MockRepository {
      constructor() {
        this.updateCalls = [];
      }
      async update(where, data) {
        this.updateCalls.push({ where, data });
        return { id: where.id, ...data };
      }
    }

    const service = new UpdateConfiguracaoService(MockRepository, id, payload);
    const result = await service.execute();

    expect(result).toEqual({ id, tolerancia: 7 });
    expect(service.repository.updateCalls[0].data).toEqual({ tolerancia: 7 });
  });

  test('execute propagates repository errors', async () => {
    const err = new Error('update-fail');
    class MockRepository {
      async update() {
        throw err;
      }
    }

    const service = new UpdateConfiguracaoService(MockRepository, 'x', { duracaoDaAula: 30 });
    await expect(service.execute()).rejects.toThrow('update-fail');
  });
});
