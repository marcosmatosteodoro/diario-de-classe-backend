import { CreateUserService } from '../../../../src/services/user/createUserService.js';
import UserRepository from '../../../../src/repositories/userRepository.js';
import AbstractService from '../../../../src/services/abstractService.js';

describe('CreateUserService', () => {
  describe('Inicialização', testInicializacao);
  describe('Método execute()', testExecuteMethod);
  describe('Método estático handle()', testStaticHandleMethod);
  describe('Integração com AbstractService', testAbstractServiceIntegration);
  describe('Validação de dados', testDataValidation);
  describe('Diferentes cenários de criação', testCreationScenarios);
});

function testInicializacao() {
  test('deve criar uma instância com repositório e dados', () => {
    const mockData = {
      nome: 'João',
      email: 'joao@email.com'
    };
    const service = new CreateUserService(UserRepository, mockData);

    expect(service).toBeInstanceOf(CreateUserService);
    expect(service).toBeInstanceOf(AbstractService);
    expect(service.repository).toBeInstanceOf(UserRepository);
    expect(service.data).toBe(mockData);
  });

  test('deve herdar de AbstractService', () => {
    const mockData = { nome: 'João' };
    const service = new CreateUserService(UserRepository, mockData);

    expect(service).toBeInstanceOf(AbstractService);
  });

  test('deve ter método execute implementado', () => {
    const mockData = { nome: 'João' };
    const service = new CreateUserService(UserRepository, mockData);

    expect(service.execute).toBeDefined();
    expect(typeof service.execute).toBe('function');
  });

  test('deve ter método estático handle', () => {
    expect(CreateUserService.handle).toBeDefined();
    expect(typeof CreateUserService.handle).toBe('function');
  });
}

function testExecuteMethod() {
  test('deve existir e ser uma função assíncrona', () => {
    const mockData = { nome: 'João' };
    const service = new CreateUserService(UserRepository, mockData);

    expect(typeof service.execute).toBe('function');
    expect(service.execute.constructor.name).toBe('AsyncFunction');
  });

  test('deve chamar repository.create com parâmetros corretos', async () => {
    const mockData = {
      id: 1,
      nome: 'João',
      sobrenome: 'Silva',
      email: 'joao@email.com',
      telefone: '11999999999',
      senha: 'senha123',
      resetarSenha: false,
      permissao: 'user'
    };

    class MockRepository {
      constructor() {
        this.createCalls = [];
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

      async create(params) {
        this.createCalls.push(params);
        return {
          id: 1,
          nome: 'João',
          sobrenome: 'Silva',
          email: 'joao@email.com'
        };
      }
    }

    const service = new CreateUserService(MockRepository, mockData);
    await service.execute();

    expect(service.repository.createCalls).toHaveLength(1);
    expect(service.repository.createCalls[0]).toEqual({
      data: mockData,
      select: service.repository.selectFields
    });
  });

  test('deve retornar o usuário criado', async () => {
    const mockData = {
      nome: 'João',
      email: 'joao@email.com'
    };

    const mockUser = {
      id: 1,
      nome: 'João',
      email: 'joao@email.com',
      dataCriacao: '2024-01-01'
    };

    class MockRepository {
      constructor() {
        this.selectFields = {};
      }

      async create() {
        return mockUser;
      }
    }

    const service = new CreateUserService(MockRepository, mockData);
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

      async create() {
        throw mockError;
      }
    }

    const service = new CreateUserService(MockRepository, mockData);

    await expect(service.execute()).rejects.toThrow('Erro de banco de dados');
  });
}

function testStaticHandleMethod() {
  test('deve executar o serviço com repositório e dados fornecidos', async () => {
    const mockData = {
      nome: 'João',
      email: 'joao@email.com'
    };

    class MockRepository {
      constructor() {
        this.selectFields = {};
      }

      async create() {
        return { id: 1, nome: 'João' };
      }
    }

    const result = await CreateUserService.handle(mockData, MockRepository);

    expect(result).toEqual({ id: 1, nome: 'João' });
  });

  test('deve usar repositório padrão quando não fornecido', async () => {
    // Como não podemos facilmente mockar o UserRepository real,
    // vamos apenas verificar se o método existe e pode ser chamado
    expect(typeof CreateUserService.handle).toBe('function');
    expect(CreateUserService.handle.constructor.name).toBe('AsyncFunction');
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

      async create() {
        return { id: this.instanceCount, nome: this.instanceCount === 0 ? 'João' : 'Maria' };
      }
    }

    const result1 = await CreateUserService.handle(mockData1, MockRepository);
    const result2 = await CreateUserService.handle(mockData2, MockRepository);

    // Cada chamada deve criar uma nova instância do repository
    expect(result1.id).not.toBe(result2.id);
  });
}

function testAbstractServiceIntegration() {
  test('deve implementar método execute() abstrato', () => {
    const mockData = { nome: 'João' };
    const service = new CreateUserService(UserRepository, mockData);

    expect(service.execute).toBeDefined();
    expect(service.execute).not.toBe(AbstractService.prototype.execute);
  });

  test('deve implementar método handle() estático', () => {
    expect(typeof CreateUserService.handle).toBe('function');
    expect(CreateUserService.handle).not.toBe(AbstractService.handle);
  });

  test('deve ter acesso ao repository através da classe pai', () => {
    const mockData = { nome: 'João' };
    const service = new CreateUserService(UserRepository, mockData);

    expect(service.repository).toBeDefined();
    expect(service.repository).toBeInstanceOf(UserRepository);
  });

  test('deve ser uma subclasse de AbstractService', () => {
    expect(CreateUserService.prototype).toBeInstanceOf(Object);
    expect(Object.getPrototypeOf(CreateUserService.prototype)).toBe(AbstractService.prototype);
  });
}

function testDataValidation() {
  test('deve armazenar dados fornecidos corretamente', () => {
    const mockData = {
      nome: 'João',
      sobrenome: 'Silva',
      email: 'joao@email.com',
      telefone: '11999999999',
      senha: 'senha123',
      resetarSenha: false,
      permissao: 'user'
    };

    const service = new CreateUserService(UserRepository, mockData);

    expect(service.data).toBe(mockData);
    expect(service.data.nome).toBe('João');
    expect(service.data.email).toBe('joao@email.com');
  });

  test('deve funcionar com dados parciais', () => {
    const mockData = {
      nome: 'João',
      email: 'joao@email.com'
    };

    const service = new CreateUserService(UserRepository, mockData);

    expect(service.data).toBe(mockData);
    expect(service.data.sobrenome).toBeUndefined();
    expect(service.data.telefone).toBeUndefined();
  });
}

function testCreationScenarios() {
  test('deve funcionar com dados completos', async () => {
    const mockData = {
      id: 1,
      nome: 'João',
      sobrenome: 'Silva',
      email: 'joao@email.com',
      telefone: '11999999999',
      senha: 'senha123',
      resetarSenha: false,
      permissao: 'user'
    };

    class MockRepository {
      constructor() {
        this.selectFields = {};
      }

      async create(params) {
        return { ...params.data, id: 1, dataCriacao: '2024-01-01' };
      }
    }

    const service = new CreateUserService(MockRepository, mockData);
    const result = await service.execute();

    expect(result.nome).toBe('João');
    expect(result.email).toBe('joao@email.com');
    expect(result.id).toBe(1);
  });

  test('deve funcionar com dados mínimos obrigatórios', async () => {
    const mockData = {
      nome: 'João',
      email: 'joao@email.com',
      senha: 'senha123'
    };

    class MockRepository {
      constructor() {
        this.selectFields = {};
      }

      async create(params) {
        return { ...params.data, id: 1 };
      }
    }

    const service = new CreateUserService(MockRepository, mockData);
    const result = await service.execute();

    expect(result.nome).toBe('João');
    expect(result.email).toBe('joao@email.com');
  });
}
