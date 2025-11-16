import { CreateConfiguracaoService } from '../../../../src/services/configuracao/createConfiguracaoService.js';

describe('CreateConfiguracaoService (unit)', () => {
  test('execute calls repository.create with cleaned data and select, returns created record', async () => {
    const input = {
      duracaoDaAula: 45,
      tolerancia: 5,
      diasDeFuncionamento: ['segunda', 'terca']
    };

    class MockRepository {
      constructor() {
        this.selectFields = { id: true };
        this.createCalls = [];
      }

      async create(data, options) {
        this.createCalls.push({ data, options });
        return { id: 'cfg-1', ...data };
      }
    }

    const service = new CreateConfiguracaoService(MockRepository, input);
    const result = await service.execute();

    expect(result).toEqual({ id: 'cfg-1', ...input });
    expect(service.repository.createCalls).toHaveLength(1);
    const call = service.repository.createCalls[0];
    expect(call.data).toEqual(input);
    expect(call.options).toEqual({ select: service.repository.selectFields });
  });

  test('execute removes undefined fields before calling repository.create', async () => {
    const input = { duracaoDaAula: undefined, tolerancia: 10 };

    class MockRepository {
      constructor() {
        this.selectFields = { id: true };
        this.createCalls = [];
      }
      async create(data) {
        this.createCalls.push(data);
        return { id: 'cfg-2', ...data };
      }
    }

    const service = new CreateConfiguracaoService(MockRepository, input);
    const result = await service.execute();

    expect(result).toEqual({ id: 'cfg-2', tolerancia: 10 });
    expect(service.repository.createCalls[0]).toEqual({ tolerancia: 10 });
  });

  test('execute propagates repository errors', async () => {
    const err = new Error('create-fail');
    class MockRepository {
      async create() {
        throw err;
      }
    }

    const service = new CreateConfiguracaoService(MockRepository, { duracaoDaAula: 30 });
    await expect(service.execute()).rejects.toThrow('create-fail');
  });
});
