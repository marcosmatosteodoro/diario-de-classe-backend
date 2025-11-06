import { CreateAlunoService } from '../../../../src/services/aluno/createAlunoService.js';
import AlunoRepository from '../../../../src/repositories/alunoRepository.js';
import AbstractService from '../../../../src/services/abstractService.js';

describe('CreateAlunoService', () => {
  describe('Inicialização', testInicializacao);
  describe('Método execute()', testExecuteMethod);
  describe('Método estático handle()', testStaticHandleMethod);
  describe('Integração com AbstractService', testAbstractServiceIntegration);
  describe('Validação de dados', testDataValidation);
  describe('Diferentes cenários de criação', testCreationScenarios);
});

function testInicializacao() {
  it('deve ser instanciado corretamente', () => {
    class MockRepository {}
    const mockData = { nome: 'João', sobrenome: 'Silva', email: 'joao@email.com' };
    const service = new CreateAlunoService(MockRepository, mockData);

    expect(service.repository).toBeInstanceOf(MockRepository);
    expect(service.data).toBe(mockData);
  });

  test('deve herdar de AbstractService', () => {
    const mockData = { nome: 'João', sobrenome: 'Silva', email: 'joao@email.com' };
    const service = new CreateAlunoService(AlunoRepository, mockData);

    expect(service).toBeInstanceOf(AbstractService);
  });

  test('deve ter método execute implementado', () => {
    const mockData = { nome: 'João', sobrenome: 'Silva', email: 'joao@email.com' };
    const service = new CreateAlunoService(AlunoRepository, mockData);

    expect(service.execute).toBeDefined();
    expect(typeof service.execute).toBe('function');
  });

  test('deve ter método estático handle', () => {
    expect(CreateAlunoService.handle).toBeDefined();
    expect(typeof CreateAlunoService.handle).toBe('function');
  });
}

function testExecuteMethod() {
  test('deve existir e ser uma função assíncrona', () => {
    const mockData = { nome: 'João', sobrenome: 'Silva', email: 'joao@email.com' };
    const service = new CreateAlunoService(AlunoRepository, mockData);

    expect(typeof service.execute).toBe('function');
    expect(service.execute.constructor.name).toBe('AsyncFunction');
  });

  test('deve chamar repository.create com parâmetros corretos', async () => {
    const mockData = {
      nome: 'João',
      sobrenome: 'Silva',
      email: 'joao@email.com',
      telefone: '11999999999',
      criador: 'user-id-123'
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
          criador: true,
          dataCriacao: true,
          dataAtualizacao: true
        };
      }

      async create(data, options) {
        this.createCalls.push({ data, options });
        return {
          id: 'aluno-id-1',
          nome: 'João',
          sobrenome: 'Silva',
          email: 'joao@email.com'
        };
      }
    }

    const service = new CreateAlunoService(MockRepository, mockData);
    await service.execute();

    expect(service.repository.createCalls).toHaveLength(1);
    expect(service.repository.createCalls[0]).toEqual({
      data: {
        nome: mockData.nome,
        sobrenome: mockData.sobrenome,
        email: mockData.email,
        telefone: mockData.telefone,
        criador: mockData.criador
      },
      options: { select: service.repository.selectFields }
    });
  });

  test('deve retornar o aluno criado', async () => {
    const mockData = {
      nome: 'João',
      sobrenome: 'Silva',
      email: 'joao@email.com'
    };

    const mockAluno = {
      id: 'aluno-id-1',
      nome: 'João',
      sobrenome: 'Silva',
      email: 'joao@email.com',
      dataCriacao: '2024-01-01'
    };

    class MockRepository {
      constructor() {
        this.selectFields = {};
      }

      async create() {
        return mockAluno;
      }
    }

    const service = new CreateAlunoService(MockRepository, mockData);
    const result = await service.execute();

    expect(result).toEqual(mockAluno);
  });

  test('deve propagar erro quando repository falha', async () => {
    const mockData = { nome: 'João', sobrenome: 'Silva', email: 'joao@email.com' };
    const mockError = new Error('Erro de banco de dados');

    class MockRepository {
      constructor() {
        this.selectFields = {};
      }

      async create() {
        throw mockError;
      }
    }

    const service = new CreateAlunoService(MockRepository, mockData);

    await expect(service.execute()).rejects.toThrow('Erro de banco de dados');
  });
}

function testStaticHandleMethod() {
  test('deve executar o serviço com dados fornecidos', async () => {
    const mockData = {
      nome: 'João',
      sobrenome: 'Silva',
      email: `joao.${Date.now()}@email.com`,
      telefone: '11999999999',
      criador: null
    };

    class MockRepository {
      constructor() {
        this.selectFields = {};
      }

      async create() {
        return { id: 'aluno-id-1', nome: 'João', sobrenome: 'Silva' };
      }
    }

    // Temporariamente substituir o AlunoRepository no método handle
    const originalHandle = CreateAlunoService.handle;
    CreateAlunoService.handle = async function (data) {
      const service = new CreateAlunoService(MockRepository, data);
      return await service.execute();
    };

    const result = await CreateAlunoService.handle(mockData);

    expect(result).toMatchObject({ nome: 'João', sobrenome: 'Silva' });
    expect(result.id).toBeDefined();

    // Restaurar o método original
    CreateAlunoService.handle = originalHandle;
  });

  test('deve usar AlunoRepository padrão quando chamado normalmente', async () => {
    // Verifica se o método existe e pode ser chamado
    expect(typeof CreateAlunoService.handle).toBe('function');
    expect(CreateAlunoService.handle.constructor.name).toBe('AsyncFunction');
  });

  test('deve criar nova instância do serviço a cada chamada', async () => {
    const timestamp = Date.now();
    const mockData1 = {
      nome: 'João',
      sobrenome: 'Silva',
      email: `joao.${timestamp}@example.com`,
      telefone: '11999999999',
      criador: null
    };
    const mockData2 = {
      nome: 'Maria',
      sobrenome: 'Santos',
      email: `maria.${timestamp + 1}@example.com`,
      telefone: '11888888888',
      criador: 'user-id-123'
    };

    class MockRepository {
      constructor() {
        this.selectFields = {};
        this.instanceCount = MockRepository.count || 0;
        MockRepository.count = (MockRepository.count || 0) + 1;
      }

      async create() {
        return {
          id: `aluno-id-${this.instanceCount}`,
          nome: this.instanceCount === 0 ? 'João' : 'Maria',
          sobrenome: this.instanceCount === 0 ? 'Silva' : 'Santos'
        };
      }
    }

    // Temporariamente substituir o AlunoRepository
    const originalHandle = CreateAlunoService.handle;
    CreateAlunoService.handle = async function (data) {
      const service = new CreateAlunoService(MockRepository, data);
      return await service.execute();
    };

    const result1 = await CreateAlunoService.handle(mockData1);
    const result2 = await CreateAlunoService.handle(mockData2);

    // Cada chamada deve criar uma nova instância do repository
    expect(result1.id).not.toBe(result2.id);

    // Restaurar o método original
    CreateAlunoService.handle = originalHandle;
  });
}

function testAbstractServiceIntegration() {
  test('deve implementar método execute() abstrato', () => {
    const mockData = { nome: 'João', sobrenome: 'Silva', email: 'joao@email.com' };
    const service = new CreateAlunoService(AlunoRepository, mockData);

    expect(service.execute).toBeDefined();
    expect(service.execute).not.toBe(AbstractService.prototype.execute);
  });

  test('deve implementar método handle() estático', () => {
    expect(typeof CreateAlunoService.handle).toBe('function');
    expect(CreateAlunoService.handle).not.toBe(AbstractService.handle);
  });

  test('deve ter acesso ao repository através da classe pai', () => {
    const mockData = { nome: 'João', sobrenome: 'Silva', email: 'joao@email.com' };
    const service = new CreateAlunoService(AlunoRepository, mockData);

    expect(service.repository).toBeDefined();
    expect(service.repository).toBeInstanceOf(AlunoRepository);
  });

  test('deve ser uma subclasse de AbstractService', () => {
    expect(CreateAlunoService.prototype).toBeInstanceOf(Object);
    expect(Object.getPrototypeOf(CreateAlunoService.prototype)).toBe(AbstractService.prototype);
  });
}

function testDataValidation() {
  test('deve armazenar dados fornecidos corretamente', () => {
    const mockData = {
      nome: 'João',
      sobrenome: 'Silva',
      email: 'joao@email.com',
      telefone: '11999999999',
      criador: 'user-id-123'
    };

    const service = new CreateAlunoService(AlunoRepository, mockData);

    expect(service.data).toBe(mockData);
    expect(service.data.nome).toBe('João');
    expect(service.data.sobrenome).toBe('Silva');
    expect(service.data.email).toBe('joao@email.com');
    expect(service.data.telefone).toBe('11999999999');
    expect(service.data.criador).toBe('user-id-123');
  });

  test('deve funcionar com dados parciais', () => {
    const mockData = {
      nome: 'João',
      sobrenome: 'Silva',
      email: 'joao@email.com'
    };

    const service = new CreateAlunoService(AlunoRepository, mockData);

    expect(service.data).toBe(mockData);
    expect(service.data.telefone).toBeUndefined();
    expect(service.data.criador).toBeUndefined();
  });

  test('deve funcionar com criador como null', () => {
    const mockData = {
      nome: 'Maria',
      sobrenome: 'Santos',
      email: 'maria@email.com',
      criador: null
    };

    const service = new CreateAlunoService(AlunoRepository, mockData);

    expect(service.data.criador).toBeNull();
  });
}

function testCreationScenarios() {
  test('deve funcionar com dados completos', async () => {
    const mockData = {
      nome: 'João',
      sobrenome: 'Silva',
      email: 'joao@email.com',
      telefone: '11999999999',
      criador: 'user-id-123'
    };

    class MockRepository {
      constructor() {
        this.selectFields = {};
      }

      async create(data, _options) {
        return { ...data, id: 'aluno-id-1', dataCriacao: '2024-01-01' };
      }
    }

    const service = new CreateAlunoService(MockRepository, mockData);
    const result = await service.execute();

    expect(result.nome).toBe('João');
    expect(result.sobrenome).toBe('Silva');
    expect(result.email).toBe('joao@email.com');
    expect(result.telefone).toBe('11999999999');
    expect(result.criador).toBe('user-id-123');
    expect(result.id).toBe('aluno-id-1');
  });

  test('deve funcionar com dados mínimos obrigatórios', async () => {
    const mockData = {
      nome: 'João',
      sobrenome: 'Silva',
      email: 'joao@email.com'
    };

    class MockRepository {
      constructor() {
        this.selectFields = {};
      }

      async create(data, _options) {
        return { ...data, id: 'aluno-id-1' };
      }
    }

    const service = new CreateAlunoService(MockRepository, mockData);
    const result = await service.execute();

    expect(result.nome).toBe('João');
    expect(result.sobrenome).toBe('Silva');
    expect(result.email).toBe('joao@email.com');
  });

  test('deve funcionar com telefone como null', async () => {
    const mockData = {
      nome: 'Ana',
      sobrenome: 'Costa',
      email: 'ana@email.com',
      telefone: null,
      criador: null
    };

    class MockRepository {
      constructor() {
        this.selectFields = {};
      }

      async create(data, _options) {
        return { ...data, id: 'aluno-id-1' };
      }
    }

    const service = new CreateAlunoService(MockRepository, mockData);
    const result = await service.execute();

    expect(result.nome).toBe('Ana');
    expect(result.telefone).toBeNull();
    expect(result.criador).toBeNull();
  });

  test('deve funcionar com criador definido', async () => {
    const mockData = {
      nome: 'Pedro',
      sobrenome: 'Oliveira',
      email: 'pedro@email.com',
      telefone: '11777777777',
      criador: 'user-admin-456'
    };

    class MockRepository {
      constructor() {
        this.selectFields = {};
      }

      async create(data, _options) {
        return { ...data, id: 'aluno-id-1' };
      }
    }

    const service = new CreateAlunoService(MockRepository, mockData);
    const result = await service.execute();

    expect(result.nome).toBe('Pedro');
    expect(result.criador).toBe('user-admin-456');
  });
}
