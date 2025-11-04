import AbstractService from '../../../src/services/abstractService.js';

describe('AbstractService', () => {
  describe('Instanciação', () => {
    test('não deve permitir instanciação direta', () => {
      expect(() => {
        // eslint-disable-next-line no-new
        new AbstractService(class MockRepository {});
      }).toThrow('AbstractService não pode ser instanciada diretamente');
    });

    test('deve exigir Repository no construtor', () => {
      class TestService extends AbstractService {}

      expect(() => {
        // eslint-disable-next-line no-new
        new TestService();
      }).toThrow('Repository é obrigatório');
    });

    test('deve permitir herança correta', () => {
      class MockRepository {}
      class TestService extends AbstractService {
        constructor(Repository) {
          super(Repository);
        }

        async execute() {
          return 'test';
        }

        static async handle() {
          return 'handled';
        }
      }

      const service = new TestService(MockRepository);

      expect(service).toBeInstanceOf(AbstractService);
      expect(service).toBeInstanceOf(TestService);
      expect(service.repository).toBeInstanceOf(MockRepository);
    });
  });

  describe('Métodos abstratos', () => {
    class MockRepository {}
    class TestService extends AbstractService {
      constructor(Repository) {
        super(Repository);
      }
    }

    test('deve lançar erro se execute não for implementado', async () => {
      const service = new TestService(MockRepository);

      await expect(service.execute()).rejects.toThrow(
        'Método execute() deve ser implementado na subclasse'
      );
    });

    test('deve lançar erro se handle não for implementado', async () => {
      await expect(TestService.handle()).rejects.toThrow(
        'Método handle() deve ser implementado na subclasse'
      );
    });
  });

  describe('Implementação correta', () => {
    class MockRepository {
      getData() {
        return 'mock data';
      }
    }

    class TestService extends AbstractService {
      constructor(Repository = MockRepository) {
        super(Repository);
      }

      async execute() {
        return this.repository.getData();
      }

      static async handle(Repository = MockRepository) {
        const service = new TestService(Repository);
        return await service.execute();
      }
    }

    test('deve funcionar corretamente quando implementado', async () => {
      const service = new TestService();

      expect(service.repository).toBeInstanceOf(MockRepository);

      const result = await service.execute();

      expect(result).toBe('mock data');
    });

    test('método handle deve funcionar corretamente', async () => {
      const result = await TestService.handle();

      expect(result).toBe('mock data');
    });
  });
});
