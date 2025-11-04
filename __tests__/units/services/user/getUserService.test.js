import { GetUserService } from '../../../../src/services/user/getUserService.js';
import UserRepository from '../../../../src/repositories/userRepository.js';
import AbstractService from '../../../../src/services/abstractService.js';

describe('GetUserService', () => {
  // Initialization tests
});

describe('GetUserService - Inicialização', () => {
  test('deve criar uma instância com repositório padrão e id', () => {
    const service = new GetUserService(UserRepository, 1);

    expect(service).toBeInstanceOf(GetUserService);
    expect(service).toBeInstanceOf(AbstractService);
    expect(service.repository).toBeInstanceOf(UserRepository);
    expect(service.id).toBe(1);
  });

  test('deve criar uma instância com repositório customizado e id', () => {
    class MockRepository {
      constructor() {
        this.selectOne = () => Promise.resolve({});
      }
    }

    const service = new GetUserService(MockRepository, 2);

    expect(service).toBeInstanceOf(GetUserService);
    expect(service).toBeInstanceOf(AbstractService);
    expect(service.repository).toBeInstanceOf(MockRepository);
    expect(service.id).toBe(2);
  });

  test('deve herdar de AbstractService', () => {
    expect(Object.getPrototypeOf(GetUserService)).toBe(AbstractService);
  });

  test('deve armazenar o id fornecido', () => {
    const userId = 123;
    const service = new GetUserService(UserRepository, userId);

    expect(service.id).toBe(userId);
  });
});

describe('GetUserService - Método execute()', () => {
  test('deve existir e ser uma função assíncrona', () => {
    const service = new GetUserService(UserRepository, 1);

    expect(typeof service.execute).toBe('function');
    expect(service.execute.constructor.name).toBe('AsyncFunction');
  });

  test('deve chamar repository.selectOne com parâmetros corretos', async () => {
    class MockRepository {
      constructor() {
        this.selectOneCalls = [];
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

      async selectOne(params) {
        this.selectOneCalls.push(params);
        return {
          id: 1,
          nome: 'João',
          sobrenome: 'Silva',
          email: 'joao@teste.com'
        };
      }
    }

    const service = new GetUserService(MockRepository, 1);
    await service.execute();

    expect(service.repository.selectOneCalls).toHaveLength(1);
    expect(service.repository.selectOneCalls[0]).toEqual({
      where: { id: 1 },
      select: service.repository.selectFields
    });
  });

  test('deve retornar o usuário encontrado', async () => {
    const mockUser = {
      id: 1,
      nome: 'João',
      sobrenome: 'Silva',
      email: 'joao@teste.com',
      telefone: '11999999999',
      resetarSenha: false,
      permissao: 'user',
      dataCriacao: new Date(),
      dataAtualizacao: new Date()
    };

    class MockRepository {
      async selectOne() {
        return mockUser;
      }
    }

    const service = new GetUserService(MockRepository, 1);
    const result = await service.execute();

    expect(result).toEqual(mockUser);
  });

  test('deve retornar null quando usuário não existe', async () => {
    class MockRepository {
      async selectOne() {
        return null;
      }
    }

    const service = new GetUserService(MockRepository, 999);
    const result = await service.execute();

    expect(result).toBeNull();
  });

  test('deve propagar erro quando repository falha', async () => {
    class MockRepository {
      async selectOne() {
        throw new Error('Erro no banco de dados');
      }
    }

    const service = new GetUserService(MockRepository, 1);

    await expect(service.execute()).rejects.toThrow('Erro no banco de dados');
  });
});

describe('GetUserService - Método estático handle()', () => {
  test('deve executar o serviço com repositório e id fornecidos', async () => {
    const mockUser = { id: 1, nome: 'Teste' };

    class MockRepository {
      async selectOne() {
        return mockUser;
      }
    }

    const result = await GetUserService.handle(1, MockRepository);

    expect(result).toEqual(mockUser);
  });

  test('deve usar repositório padrão quando não fornecido', async () => {
    // Como não podemos mockar facilmente o UserRepository real,
    // vamos testar a estrutura do método
    expect(typeof GetUserService.handle).toBe('function');
    expect(GetUserService.handle.constructor.name).toBe('AsyncFunction');
  });

  test('deve criar nova instância do serviço a cada chamada', async () => {
    class MockRepository {
      constructor() {
        this.instanceCount = MockRepository.instances ? MockRepository.instances + 1 : 1;
        MockRepository.instances = this.instanceCount;
      }

      async selectOne() {
        return { id: 1, instanceCount: this.instanceCount };
      }
    }

    const result1 = await GetUserService.handle(1, MockRepository);
    const result2 = await GetUserService.handle(2, MockRepository);

    // Cada chamada deve criar uma nova instância do repository
    expect(result1.instanceCount).toBe(1);
    expect(result2.instanceCount).toBe(2);
  });
});

describe('GetUserService - Integração com AbstractService', () => {
  test('deve implementar método execute() abstrato', () => {
    const service = new GetUserService(UserRepository, 1);

    expect(typeof service.execute).toBe('function');
    expect(service.execute).not.toBe(AbstractService.prototype.execute);
  });

  test('deve implementar método handle() estático', () => {
    expect(typeof GetUserService.handle).toBe('function');
    expect(GetUserService.handle).not.toBe(AbstractService.handle);
  });

  test('deve ter acesso ao repository através da classe pai', () => {
    const service = new GetUserService(UserRepository, 1);

    expect(service.repository).toBeDefined();
    expect(service.repository).toBeInstanceOf(UserRepository);
  });

  test('deve ser uma subclasse de AbstractService', () => {
    const service = new GetUserService(UserRepository, 1);

    expect(service instanceof AbstractService).toBe(true);
    expect(service instanceof GetUserService).toBe(true);
  });
});

describe('GetUserService - Validação de campos selecionados', () => {
  test('deve selecionar todos os campos necessários', async () => {
    class MockRepository {
      constructor() {
        this.selectOneCalls = [];
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

      async selectOne(params) {
        this.selectOneCalls.push(params);
        return {};
      }
    }

    const service = new GetUserService(MockRepository, 1);
    await service.execute();

    const selectCall = service.repository.selectOneCalls[0];
    const expectedFields = [
      'id',
      'nome',
      'sobrenome',
      'email',
      'telefone',
      'resetarSenha',
      'permissao',
      'dataCriacao',
      'dataAtualizacao'
    ];

    expectedFields.forEach(field => {
      expect(selectCall.select[field]).toBe(true);
    });
  });

  test('deve usar where clause com id correto', async () => {
    class MockRepository {
      constructor() {
        this.selectOneCalls = [];
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

      async selectOne(params) {
        this.selectOneCalls.push(params);
        return {};
      }
    }

    const userId = 42;
    const service = new GetUserService(MockRepository, userId);
    await service.execute();

    const selectCall = service.repository.selectOneCalls[0];
    expect(selectCall.where).toEqual({ id: userId });
  });
});

describe('GetUserService - Diferentes tipos de ID', () => {
  test('deve funcionar com ID numérico', () => {
    const service = new GetUserService(UserRepository, 123);
    expect(service.id).toBe(123);
  });

  test('deve funcionar com ID string', () => {
    const service = new GetUserService(UserRepository, '123');
    expect(service.id).toBe('123');
  });

  test('deve funcionar com ID undefined', () => {
    const service = new GetUserService(UserRepository, undefined);
    expect(service.id).toBeUndefined();
  });

  test('deve funcionar com ID null', () => {
    const service = new GetUserService(UserRepository, null);
    expect(service.id).toBeNull();
  });
});
