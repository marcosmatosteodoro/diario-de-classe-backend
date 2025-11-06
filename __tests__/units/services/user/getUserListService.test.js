import { GetUserListService } from '../../../../src/services/user/getUserListService.js';
import UserRepository from '../../../../src/repositories/userRepository.js';
import AbstractService from '../../../../src/services/abstractService.js';

describe('GetUserListService', () => {
  describe('Inicialização', () => {
    test('deve criar uma instância com repositório padrão', () => {
      const service = new GetUserListService(UserRepository, {});

      expect(service).toBeInstanceOf(GetUserListService);
      expect(service).toBeInstanceOf(AbstractService);
      expect(service.repository).toBeInstanceOf(UserRepository);
    });

    test('deve aceitar where clause no construtor', () => {
      const whereClause = { nome: { contains: 'João' } };
      const service = new GetUserListService(UserRepository, whereClause);

      expect(service.where).toEqual(whereClause);
    });

    test('deve herdar de AbstractService', () => {
      expect(Object.getPrototypeOf(GetUserListService)).toBe(AbstractService);
    });

    test('deve ter método execute implementado', () => {
      const service = new GetUserListService(UserRepository, {});

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
      const service = new GetUserListService(UserRepository, {});

      // Verifica se tem os métodos necessários
      expect(service.execute).toBeDefined();
      expect(service.repository).toBeDefined();
      expect(service.where).toBeDefined();
      expect(GetUserListService.handle).toBeDefined();
    });

    test('deve ter repository configurado', () => {
      const service = new GetUserListService(UserRepository, {});

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

      const service = new GetUserListService(MockRepository, {});

      expect(service.repository).toBeInstanceOf(MockRepository);
    });
  });

  describe('Integração com AbstractService', () => {
    test('deve chamar super no construtor', () => {
      const service = new GetUserListService(UserRepository, {});

      // Verifica se as propriedades da classe pai estão disponíveis
      expect(service.repository).toBeDefined();
    });

    test('deve implementar método execute abstrato', () => {
      const service = new GetUserListService(UserRepository, {});

      // O método execute deve ser diferente do da classe abstrata
      expect(service.execute).not.toBe(AbstractService.prototype.execute);
      expect(typeof service.execute).toBe('function');
    });

    test('deve ser uma subclasse de AbstractService', () => {
      const service = new GetUserListService(UserRepository, {});

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

      const service = new GetUserListService(MockRepository, {});
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

      const service = new GetUserListService(MockRepository, whereClause);
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

      const service = new GetUserListService(MockRepository, {});
      await service.execute();
      // O teste passa se não lançar exceção
    });
  });

  describe('Método estático handle', () => {
    test('deve executar com where clause vazio', async () => {
      const result = await GetUserListService.handle({});

      expect(Array.isArray(result)).toBe(true);
      // Verifica se retorna array (pode estar vazio ou com dados)
      if (result.length > 0) {
        expect(result[0]).toHaveProperty('id');
        expect(result[0]).toHaveProperty('nome');
      }
    });

    test('deve executar com where clause específico', async () => {
      // Usa uma busca que provavelmente não retornará resultados
      const whereClause = { nome: { contains: 'TestUsuarioNaoExistente' } };

      const result = await GetUserListService.handle(whereClause);

      expect(Array.isArray(result)).toBe(true);
      // Esperamos que não encontre usuários com esse nome específico
      expect(result).toHaveLength(0);
    });

    test('deve usar repositório padrão UserRepository', async () => {
      const result = await GetUserListService.handle();

      expect(Array.isArray(result)).toBe(true);
      // Verifica que o método funciona sem parâmetros
      if (result.length > 0) {
        // Verifica estrutura básica do usuário retornado
        expect(result[0]).toHaveProperty('id');
        expect(result[0]).toHaveProperty('nome');
        expect(result[0]).toHaveProperty('email');
      }
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

      const service = new GetUserListService(ErrorRepository, {});

      await expect(service.execute()).rejects.toThrow('Database error');
    });
  });

  describe('Validação de parâmetros', () => {
    test('deve funcionar com where undefined', () => {
      const service = new GetUserListService(UserRepository);

      expect(service.where).toBeUndefined();
      expect(service.repository).toBeInstanceOf(UserRepository);
    });

    test('deve funcionar com Repository undefined no construtor', () => {
      expect(() => {
        const service = new GetUserListService(undefined, {});
        return service;
      }).toThrow('Repository é obrigatório');
    });
  });
});
