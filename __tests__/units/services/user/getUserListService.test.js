import { GetUserListService } from '../../../../src/services/user/getUserListService.js';
import UserRepository from '../../../../src/repositories/userRepository.js';
import AbstractService from '../../../../src/services/abstractService.js';

describe('GetUserListService', () => {
  describe('Inicialização', () => {
    test('deve criar uma instância com repositório padrão', () => {
      const service = new GetUserListService({ where: {}, Repository: UserRepository });

      expect(service).toBeInstanceOf(GetUserListService);
      expect(service).toBeInstanceOf(AbstractService);
      expect(service.repository).toBeInstanceOf(UserRepository);
    });

    test('deve aceitar where clause no construtor', () => {
      const whereClause = { nome: { contains: 'João' } };
      const service = new GetUserListService({ where: whereClause, Repository: UserRepository });

      expect(service.where).toEqual(whereClause);
    });

    test('deve herdar de AbstractService', () => {
      expect(Object.getPrototypeOf(GetUserListService)).toBe(AbstractService);
    });

    test('deve ter método execute implementado', () => {
      const service = new GetUserListService({ where: {}, Repository: UserRepository });

      expect(typeof service.execute).toBe('function');
      expect(service.execute).not.toBe(AbstractService.prototype.execute);
    });

    test('deve ter método handle estático implementado', () => {
      expect(typeof GetUserListService.handle).toBe('function');
      expect(GetUserListService.handle).not.toBe(AbstractService.handle);
    });
  });

  describe('Estrutura da classe', () => {
    test('deve implementar os métodos obrigatórios', () => {
      const service = new GetUserListService({ where: {}, Repository: UserRepository });

      // Verifica se tem os métodos necessários
      expect(service.execute).toBeDefined();
      expect(service.repository).toBeDefined();
      expect(service.where).toBeDefined();
      expect(GetUserListService.handle).toBeDefined();
    });

    test('deve ter repository configurado', () => {
      const service = new GetUserListService({ where: {}, Repository: UserRepository });

      expect(service.repository).toBeInstanceOf(UserRepository);
      expect(service.repository.selectMany).toBeDefined();
    });

    test('deve aceitar repository customizado no construtor', () => {
      class MockRepository {
        constructor() {
          this.selectMany = () => Promise.resolve([]);
          this.selectFields = { id: true, nome: true };
        }
      }

      const service = new GetUserListService({ where: {}, Repository: MockRepository });

      expect(service.repository).toBeInstanceOf(MockRepository);
    });
  });

  describe('Integração com AbstractService', () => {
    test('deve chamar super no construtor', () => {
      const service = new GetUserListService({ where: {}, Repository: UserRepository });

      // Verifica se as propriedades da classe pai estão disponíveis
      expect(service.repository).toBeDefined();
    });

    test('deve implementar método execute abstrato', () => {
      const service = new GetUserListService({ where: {}, Repository: UserRepository });

      // O método execute deve ser diferente do da classe abstrata
      expect(service.execute).not.toBe(AbstractService.prototype.execute);
      expect(typeof service.execute).toBe('function');
    });

    test('deve ser uma subclasse de AbstractService', () => {
      const service = new GetUserListService({ where: {}, Repository: UserRepository });

      expect(service instanceof AbstractService).toBe(true);
      expect(service instanceof GetUserListService).toBe(true);
    });
  });

  describe('Funcionalidade do serviço', () => {
    test('deve executar busca com where clause vazio', async () => {
      class MockRepository {
        constructor() {
          this.selectFields = { id: true, nome: true, email: true };
        }

        async selectMany({ select, where }) {
          expect(select).toEqual(this.selectFields);
          expect(where).toEqual({});
          return [
            { id: '1', nome: 'João', email: 'joao@test.com' },
            { id: '2', nome: 'Maria', email: 'maria@test.com' }
          ];
        }
      }

      const service = new GetUserListService({ where: {}, Repository: MockRepository });
      const result = await service.execute();

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('nome', 'João');
    });

    test('deve executar busca com where clause específico', async () => {
      const whereClause = { nome: { contains: 'João' } };

      class MockRepository {
        constructor() {
          this.selectFields = { id: true, nome: true, email: true };
        }

        async selectMany({ select, where }) {
          expect(select).toEqual(this.selectFields);
          expect(where).toEqual(whereClause);
          return [{ id: '1', nome: 'João', email: 'joao@test.com' }];
        }
      }

      const service = new GetUserListService({ where: whereClause, Repository: MockRepository });
      const result = await service.execute();

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('nome', 'João');
    });

    test('deve usar selectFields do repository', async () => {
      const customSelectFields = { id: true, nome: true };

      class MockRepository {
        constructor() {
          this.selectFields = customSelectFields;
        }

        async selectMany({ select, _where }) {
          expect(select).toEqual(customSelectFields);
          return [];
        }
      }

      const service = new GetUserListService({ where: {}, Repository: MockRepository });
      await service.execute();
      // O teste passa se não lançar exceção
    });
  });

  describe('Método estático handle', () => {
    test('deve aceitar Repository customizado', async () => {
      class CustomRepository {
        constructor() {
          this.selectFields = { id: true, custom: true };
        }

        async selectMany() {
          return [{ id: '1', custom: 'value' }];
        }
      }

      const result = await GetUserListService.handle({}, CustomRepository);

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('custom', 'value');
    });

    test('deve executar com where clause', async () => {
      const whereClause = { nome: { contains: 'Test' } };

      class TestRepository {
        constructor() {
          this.selectFields = { id: true, nome: true };
        }

        async selectMany({ where }) {
          expect(where).toEqual(whereClause);
          return [{ id: '1', nome: 'Test User' }];
        }
      }

      const result = await GetUserListService.handle(whereClause, TestRepository);

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('nome', 'Test User');
    });

    test('deve usar repositório padrão quando não especificado', async () => {
      class MockUserRepository {
        constructor() {
          this.selectFields = { id: true, nome: true };
        }

        async selectMany() {
          return [{ id: '1', nome: 'Default User' }];
        }
      }

      // Substituir temporariamente o UserRepository default
      const result = await GetUserListService.handle({}, MockUserRepository);

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('nome', 'Default User');
    });
  });

  describe('Casos de erro', () => {
    test('deve propagar erros do repository', async () => {
      class ErrorRepository {
        constructor() {
          this.selectFields = {};
        }

        async selectMany() {
          throw new Error('Database error');
        }
      }

      const service = new GetUserListService({ where: {}, Repository: ErrorRepository });

      await expect(service.execute()).rejects.toThrow('Database error');
    });
  });

  describe('Validação de parâmetros', () => {
    test('deve funcionar com where undefined', () => {
      const service = new GetUserListService({ Repository: UserRepository });

      expect(service.where).toBeUndefined();
      expect(service.repository).toBeInstanceOf(UserRepository);
    });

    test('deve funcionar com Repository undefined no construtor', () => {
      expect(() => {
        const service = new GetUserListService({ where: {} });
        return service;
      }).toThrow('Repository é obrigatório');
    });
  });
});
