import { GetUserService } from '../../../../src/services/user/getUserService.js';
import UserRepository from '../../../../src/repositories/userRepository.js';
import AbstractService from '../../../../src/services/abstractService.js';

describe('GetUserService', () => {
  // Initialization tests
});

describe('GetUserService - Inicialização', () => {
  test('deve criar uma instância com repositório padrão e id', () => {
    const service = new GetUserService(UserRepository, 'user-id-1');

    expect(service).toBeInstanceOf(GetUserService);
    expect(service).toBeInstanceOf(AbstractService);
    expect(service.repository).toBeInstanceOf(UserRepository);
    expect(service.id).toBe('user-id-1');
  });

  test('deve criar uma instância com repositório customizado e id', () => {
    class MockRepository {
      constructor() {
        this.selectOne = () => Promise.resolve({});
      }
    }

    const service = new GetUserService(MockRepository, 'user-id-2');

    expect(service).toBeInstanceOf(GetUserService);
    expect(service).toBeInstanceOf(AbstractService);
    expect(service.repository).toBeInstanceOf(MockRepository);
    expect(service.id).toBe('user-id-2');
  });

  test('deve herdar de AbstractService', () => {
    expect(Object.getPrototypeOf(GetUserService)).toBe(AbstractService);
  });

  test('deve armazenar o id fornecido', () => {
    const userId = 'user-id-123';
    const service = new GetUserService(UserRepository, userId);

    expect(service.id).toBe(userId);
  });
});

describe('GetUserService - Método execute()', () => {
  test('deve existir e ser uma função assíncrona', () => {
    const service = new GetUserService(UserRepository, 'user-id-1');

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
          id: 'user-id-1',
          nome: 'João',
          sobrenome: 'Silva',
          email: 'joao@teste.com'
        };
      }
    }

    const service = new GetUserService(MockRepository, 'user-id-1');
    await service.execute();

    expect(service.repository.selectOneCalls).toHaveLength(1);
    expect(service.repository.selectOneCalls[0]).toEqual({
      where: { id: 'user-id-1' },
      select: service.repository.selectFields
    });
  });

  test('deve retornar o usuário encontrado', async () => {
    const mockUser = {
      id: 'user-id-1',
      nome: 'João',
      sobrenome: 'Silva',
      email: 'joao@teste.com',
      telefone: '11999999999',
      resetarSenha: false,
      permissao: 'member',
      dataCriacao: new Date(),
      dataAtualizacao: new Date()
    };

    class MockRepository {
      async selectOne() {
        return mockUser;
      }
    }

    const service = new GetUserService(MockRepository, 'user-id-1');
    const result = await service.execute();

    expect(result).toEqual(mockUser);
  });

  test('deve retornar null quando usuário não existe', async () => {
    class MockRepository {
      async selectOne() {
        return null;
      }
    }

    const service = new GetUserService(MockRepository, 'user-not-found');
    const result = await service.execute();

    expect(result).toBeNull();
  });

  test('deve propagar erro quando repository falha', async () => {
    class MockRepository {
      async selectOne() {
        throw new Error('Erro no banco de dados');
      }
    }

    const service = new GetUserService(MockRepository, 'user-id-1');

    await expect(service.execute()).rejects.toThrow('Erro no banco de dados');
  });
});

describe('GetUserService - Método estático handle()', () => {
  test('deve ter método handle estático definido', () => {
    expect(typeof GetUserService.handle).toBe('function');
    expect(GetUserService.handle.constructor.name).toBe('AsyncFunction');
  });

  test('deve usar repositório padrão UserRepository', async () => {
    // Este teste verifica que o método existe e usa o repositório real
    // Não podemos mockar facilmente o UserRepository real aqui
    expect(typeof GetUserService.handle).toBe('function');

    // Testa com um ID que não existe para não modificar dados reais
    const result = await GetUserService.handle('id-inexistente-teste');
    expect(result).toBeNull();
  });

  test('deve aceitar apenas id como parâmetro', async () => {
    // Verifica que o método funciona apenas com ID
    const result = await GetUserService.handle('id-inexistente-teste-2');
    expect(result).toBeNull();
  });
});

describe('GetUserService - Integração com AbstractService', () => {
  test('deve implementar método execute() abstrato', () => {
    const service = new GetUserService(UserRepository, 'user-id-1');

    expect(typeof service.execute).toBe('function');
    expect(service.execute).not.toBe(AbstractService.prototype.execute);
  });

  test('deve implementar método handle() estático', () => {
    expect(typeof GetUserService.handle).toBe('function');
    expect(GetUserService.handle).not.toBe(AbstractService.handle);
  });

  test('deve ter acesso ao repository através da classe pai', () => {
    const service = new GetUserService(UserRepository, 'user-id-1');

    expect(service.repository).toBeDefined();
    expect(service.repository).toBeInstanceOf(UserRepository);
  });

  test('deve ser uma subclasse de AbstractService', () => {
    const service = new GetUserService(UserRepository, 'user-id-1');

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

    const service = new GetUserService(MockRepository, 'user-id-1');
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

    const userId = 'user-id-42';
    const service = new GetUserService(MockRepository, userId);
    await service.execute();

    const selectCall = service.repository.selectOneCalls[0];
    expect(selectCall.where).toEqual({ id: userId });
  });
});

describe('GetUserService - Diferentes tipos de ID', () => {
  test('deve funcionar com ID string', () => {
    const service = new GetUserService(UserRepository, 'user-id-123');
    expect(service.id).toBe('user-id-123');
  });

  test('deve funcionar com ID cuid', () => {
    const service = new GetUserService(UserRepository, 'cmhj1234567890abcdef');
    expect(service.id).toBe('cmhj1234567890abcdef');
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
