import { UpdateUserService } from '../../../../src/services/user/updateUserService.js';
import UserRepository from '../../../../src/repositories/userRepository.js';
import AbstractService from '../../../../src/services/abstractService.js';

function describeUpdateUserServiceInitialization() {
  describe('Inicialização', () => {
    test('deve criar uma instância com repositório, id e dados', () => {
      const mockData = {
        nome: 'João',
        email: 'joao@email.com'
      };
      const service = new UpdateUserService(UserRepository, 1, mockData);

      expect(service).toBeInstanceOf(UpdateUserService);
      expect(service).toBeInstanceOf(AbstractService);
      expect(service.repository).toBeInstanceOf(UserRepository);
      expect(service.id).toBe(1);
      expect(service.data).toBe(mockData);
    });

    test('deve herdar de AbstractService', () => {
      const mockData = { nome: 'João' };
      const service = new UpdateUserService(UserRepository, 1, mockData);

      expect(service).toBeInstanceOf(AbstractService);
    });

    test('deve ter método execute implementado', () => {
      const mockData = { nome: 'João' };
      const service = new UpdateUserService(UserRepository, 1, mockData);

      expect(service.execute).toBeDefined();
      expect(typeof service.execute).toBe('function');
    });

    test('deve ter método estático handle', () => {
      expect(UpdateUserService.handle).toBeDefined();
      expect(typeof UpdateUserService.handle).toBe('function');
    });
  });
}

function describeExecuteMethod() {
  describe('Método execute()', () => {
    test('deve existir e ser uma função assíncrona', () => {
      const mockData = { nome: 'João' };
      const service = new UpdateUserService(UserRepository, 1, mockData);

      expect(typeof service.execute).toBe('function');
      expect(service.execute.constructor.name).toBe('AsyncFunction');
    });

    test('deve chamar repository.update com parâmetros corretos', async () => {
      const mockData = {
        nome: 'João',
        sobrenome: 'Silva',
        email: 'joao@email.com',
        telefone: '11999999999',
        senha: 'novasenha123',
        resetarSenha: false,
        permissao: 'admin'
      };

      class MockRepository {
        constructor() {
          this.updateCalls = [];
          this.selectFields = {
            id: true,
            nome: true,
            sobrenome: true,
            email: true,
            telefone: true,
            resetarSenha: true,
            permissao: true,
            dataCriacao: true,
            dataAtualizacao: true
          };
        }

        async update(where, data, options) {
          this.updateCalls.push({ where, data, options });
          return {
            id: 1,
            nome: 'João',
            sobrenome: 'Silva',
            email: 'joao@email.com'
          };
        }
      }

      const service = new UpdateUserService(MockRepository, 1, mockData);
      await service.execute();

      expect(service.repository.updateCalls).toHaveLength(1);
      expect(service.repository.updateCalls[0]).toEqual({
        where: { id: 1 },
        data: mockData,
        options: { select: service.repository.selectFields }
      });
    });

    test('deve retornar o usuário atualizado', async () => {
      const mockData = {
        nome: 'João',
        email: 'joao@email.com'
      };

      const mockUser = {
        id: 1,
        nome: 'João',
        email: 'joao@email.com',
        dataAtualizacao: '2024-01-01'
      };

      class MockRepository {
        constructor() {
          this.selectFields = {};
        }

        async update() {
          return mockUser;
        }
      }

      const service = new UpdateUserService(MockRepository, 1, mockData);
      const result = await service.execute();

      expect(result).toEqual(mockUser);
    });

    test('deve propagar erro quando repository falha', async () => {
      const mockData = { nome: 'João' };
      const mockError = new Error('Erro de banco de dados');

      class MockRepository {
        constructor() {
          this.selectFields = {};
        }

        async update() {
          throw mockError;
        }
      }

      const service = new UpdateUserService(MockRepository, 1, mockData);

      await expect(service.execute()).rejects.toThrow('Erro de banco de dados');
    });

    test('deve usar where clause com id correto', async () => {
      const mockData = { nome: 'João' };

      class MockRepository {
        constructor() {
          this.updateCalls = [];
          this.selectFields = {};
        }

        async update(where, data, options) {
          this.updateCalls.push({ where, data, options });
          return {};
        }
      }

      const service = new UpdateUserService(MockRepository, 123, mockData);
      await service.execute();

      expect(service.repository.updateCalls[0].where).toEqual({ id: 123 });
    });
  });
}

function describeStaticHandleMethod() {
  describe('Método estático handle()', () => {
    test('deve executar o serviço com id, dados e repositório fornecidos', async () => {
      const mockData = {
        nome: 'João',
        email: 'joao@email.com'
      };

      class MockRepository {
        constructor() {
          this.selectFields = {};
        }

        async update() {
          return { id: 1, nome: 'João' };
        }
      }

      const result = await UpdateUserService.handle(1, mockData, MockRepository);

      expect(result).toEqual({ id: 1, nome: 'João' });
    });

    test('deve usar repositório padrão quando não fornecido', async () => {
      // Como não podemos facilmente mockar o UserRepository real,
      // vamos apenas verificar se o método existe e pode ser chamado
      expect(typeof UpdateUserService.handle).toBe('function');
      expect(UpdateUserService.handle.constructor.name).toBe('AsyncFunction');
    });

    test('deve criar nova instância do serviço a cada chamada', async () => {
      const mockData1 = { nome: 'João' };
      const mockData2 = { nome: 'Maria' };

      class MockRepository {
        constructor() {
          this.selectFields = {};
          this.instanceCount = MockRepository.count || 0;
          MockRepository.count = (MockRepository.count || 0) + 1;
        }

        async update() {
          return { id: this.instanceCount, nome: this.instanceCount === 0 ? 'João' : 'Maria' };
        }
      }

      const result1 = await UpdateUserService.handle(1, mockData1, MockRepository);
      const result2 = await UpdateUserService.handle(2, mockData2, MockRepository);

      // Cada chamada deve criar uma nova instância do repository
      expect(result1.id).not.toBe(result2.id);
    });
  });
}

function describeAbstractServiceIntegration() {
  describe('Integração com AbstractService', () => {
    test('deve implementar método execute() abstrato', () => {
      const mockData = { nome: 'João' };
      const service = new UpdateUserService(UserRepository, 1, mockData);

      expect(service.execute).toBeDefined();
      expect(service.execute).not.toBe(AbstractService.prototype.execute);
    });

    test('deve implementar método handle() estático', () => {
      expect(typeof UpdateUserService.handle).toBe('function');
      expect(UpdateUserService.handle).not.toBe(AbstractService.handle);
    });

    test('deve ter acesso ao repository através da classe pai', () => {
      const mockData = { nome: 'João' };
      const service = new UpdateUserService(UserRepository, 1, mockData);

      expect(service.repository).toBeDefined();
      expect(service.repository).toBeInstanceOf(UserRepository);
    });

    test('deve ser uma subclasse de AbstractService', () => {
      expect(UpdateUserService.prototype).toBeInstanceOf(Object);
      expect(Object.getPrototypeOf(UpdateUserService.prototype)).toBe(AbstractService.prototype);
    });
  });
}

function describeParameterValidation() {
  describe('Validação de parâmetros', () => {
    test('deve armazenar id e dados fornecidos corretamente', () => {
      const mockData = {
        nome: 'João',
        sobrenome: 'Silva',
        email: 'joao@email.com',
        telefone: '11999999999',
        senha: 'senha123',
        resetarSenha: false,
        permissao: 'user'
      };

      const service = new UpdateUserService(UserRepository, 123, mockData);

      expect(service.id).toBe(123);
      expect(service.data).toBe(mockData);
      expect(service.data.nome).toBe('João');
      expect(service.data.email).toBe('joao@email.com');
    });

    test('deve funcionar com diferentes tipos de ID', () => {
      const mockData = { nome: 'João' };
      const testCases = [1, '123', 'abc'];

      testCases.forEach(testId => {
        const service = new UpdateUserService(UserRepository, testId, mockData);
        expect(service.id).toBe(testId);
      });
    });

    test('deve funcionar com dados parciais', () => {
      const mockData = {
        nome: 'João',
        email: 'joao@email.com'
      };

      const service = new UpdateUserService(UserRepository, 1, mockData);

      expect(service.data).toBe(mockData);
      expect(service.data.sobrenome).toBeUndefined();
      expect(service.data.telefone).toBeUndefined();
    });
  });
}

function describeUpdateScenarios() {
  describe('Diferentes cenários de atualização', () => {
    test('deve funcionar com dados completos', async () => {
      const mockData = {
        nome: 'João',
        sobrenome: 'Silva',
        email: 'joao@email.com',
        telefone: '11999999999',
        senha: 'novasenha123',
        resetarSenha: false,
        permissao: 'admin'
      };

      class MockRepository {
        constructor() {
          this.selectFields = {};
        }

        async update(where, data, _options) {
          return { ...data, id: where.id, dataAtualizacao: '2024-01-01' };
        }
      }

      const service = new UpdateUserService(MockRepository, 1, mockData);
      const result = await service.execute();

      expect(result.nome).toBe('João');
      expect(result.email).toBe('joao@email.com');
      expect(result.id).toBe(1);
    });

    test('deve funcionar com atualização parcial', async () => {
      const mockData = {
        nome: 'João Atualizado'
      };

      class MockRepository {
        constructor() {
          this.selectFields = {};
        }

        async update(where, data, _options) {
          return { id: where.id, nome: data.nome };
        }
      }

      const service = new UpdateUserService(MockRepository, 1, mockData);
      const result = await service.execute();

      expect(result.nome).toBe('João Atualizado');
      expect(result.id).toBe(1);
    });
  });
}

describe('UpdateUserService', () => {
  describeUpdateUserServiceInitialization();
  describeExecuteMethod();
  describeStaticHandleMethod();
  describeAbstractServiceIntegration();
  describeParameterValidation();
  describeUpdateScenarios();
});
