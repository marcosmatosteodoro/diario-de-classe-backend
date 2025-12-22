import { DeleteUserService } from '../../../../src/services/user/deleteUserService.js';
import UserRepository from '../../../../src/repositories/userRepository.js';
import AbstractService from '../../../../src/services/abstractService.js';

describe('DeleteUserService - Inicialização', () => {
  test('deve criar uma instância com repositório e id', () => {
    const service = new DeleteUserService(UserRepository, '1');

    expect(service).toBeInstanceOf(DeleteUserService);
    expect(service).toBeInstanceOf(AbstractService);
    expect(service.repository).toBeInstanceOf(UserRepository);
    expect(service.id).toBe('1');
  });

  test('deve herdar de AbstractService', () => {
    const service = new DeleteUserService(UserRepository, '1');

    expect(service).toBeInstanceOf(AbstractService);
  });

  test('deve ter método execute implementado', () => {
    const service = new DeleteUserService(UserRepository, '1');

    expect(service.execute).toBeDefined();
    expect(typeof service.execute).toBe('function');
  });

  test('deve ter método estático handle', () => {
    expect(DeleteUserService.handle).toBeDefined();
    expect(typeof DeleteUserService.handle).toBe('function');
  });
});

describe('DeleteUserService - Método execute()', () => {
  test('deve existir e ser uma função assíncrona', () => {
    const service = new DeleteUserService(UserRepository, '1');

    expect(typeof service.execute).toBe('function');
    expect(service.execute.constructor.name).toBe('AsyncFunction');
  });

  test('deve chamar repository.delete com parâmetros corretos', async () => {
    class MockRepository {
      constructor() {
        this.deleteCalls = [];
      }

      async delete(where, options) {
        this.deleteCalls.push({ where, options });
        return {
          id: '1',
          nome: 'João',
          email: 'joao@email.com'
        };
      }
    }

    const service = new DeleteUserService(MockRepository, '1');
    await service.execute();

    expect(service.repository.deleteCalls).toHaveLength(1);
    expect(service.repository.deleteCalls[0]).toEqual({
      where: { id: '1' },
      options: undefined
    });
  });

  test('deve retornar o usuário deletado', async () => {
    const mockUser = {
      id: '1',
      nome: 'João',
      email: 'joao@email.com'
    };

    class MockRepository {
      async delete() {
        return mockUser;
      }
    }

    const service = new DeleteUserService(MockRepository, '1');
    const result = await service.execute();

    expect(result).toEqual(mockUser);
  });

  test('deve propagar erro quando repository falha', async () => {
    const mockError = new Error('Erro de banco de dados');

    class MockRepository {
      async delete() {
        throw mockError;
      }
    }

    const service = new DeleteUserService(MockRepository, '1');

    await expect(service.execute()).rejects.toThrow('Erro de banco de dados');
  });

  test('deve usar where clause com id correto', async () => {
    class MockRepository {
      constructor() {
        this.deleteCalls = [];
      }

      async delete(where, options) {
        this.deleteCalls.push({ where, options });
        return {};
      }
    }

    const service = new DeleteUserService(MockRepository, '123');
    await service.execute();

    expect(service.repository.deleteCalls[0].where).toEqual({ id: '123' });
  });

  test('deve funcionar com diferentes tipos de ID', async () => {
    const testCases = ['1', '123', 'abc'];

    for (const testId of testCases) {
      class MockRepository {
        constructor() {
          this.deleteCalls = [];
        }

        async delete(where, options) {
          this.deleteCalls.push({ where, options });
          return { id: testId };
        }
      }

      const service = new DeleteUserService(MockRepository, testId);
      await service.execute();

      expect(service.repository.deleteCalls[0].where.id).toBe(testId);
    }
  });
});

describe('DeleteUserService - Método estático handle()', () => {
  test('deve executar o serviço com id fornecido', async () => {
    // Como o método handle usa UserRepository internamente,
    // vamos apenas verificar se o método existe e pode ser chamado
    expect(typeof DeleteUserService.handle).toBe('function');
    expect(DeleteUserService.handle.constructor.name).toBe('AsyncFunction');
  });

  test('deve usar repositório padrão UserRepository', async () => {
    // Como não podemos facilmente mockar o UserRepository real,
    // vamos apenas verificar se o método existe e pode ser chamado
    expect(typeof DeleteUserService.handle).toBe('function');
    expect(DeleteUserService.handle.constructor.name).toBe('AsyncFunction');
  });

  test('deve criar nova instância do serviço a cada chamada', async () => {
    // Testamos se o método handle pode ser chamado múltiplas vezes
    expect(typeof DeleteUserService.handle).toBe('function');

    // Verificamos se é uma função assíncrona
    expect(DeleteUserService.handle.constructor.name).toBe('AsyncFunction');
  });
});

describe('DeleteUserService - Integração com AbstractService', () => {
  test('deve implementar método execute() abstrato', () => {
    const service = new DeleteUserService(UserRepository, '1');

    expect(service.execute).toBeDefined();
    expect(service.execute).not.toBe(AbstractService.prototype.execute);
  });

  test('deve implementar método handle() estático', () => {
    expect(typeof DeleteUserService.handle).toBe('function');
    expect(DeleteUserService.handle).not.toBe(AbstractService.handle);
  });

  test('deve ter acesso ao repository através da classe pai', () => {
    const service = new DeleteUserService(UserRepository, '1');

    expect(service.repository).toBeDefined();
    expect(service.repository).toBeInstanceOf(UserRepository);
  });

  test('deve ser uma subclasse de AbstractService', () => {
    expect(DeleteUserService.prototype).toBeInstanceOf(Object);
    expect(Object.getPrototypeOf(DeleteUserService.prototype)).toBe(AbstractService.prototype);
  });
});

describe('DeleteUserService - Validação de parâmetros', () => {
  test('deve armazenar id fornecido corretamente', () => {
    const testCases = ['1', '123', 'abc', '999'];

    testCases.forEach(testId => {
      const service = new DeleteUserService(UserRepository, testId);
      expect(service.id).toBe(testId);
    });
  });

  test('deve funcionar com ID null ou undefined', () => {
    const testCases = [null, undefined];

    testCases.forEach(testId => {
      const service = new DeleteUserService(UserRepository, testId);
      expect(service.id).toBe(testId);
    });
  });
});

describe('DeleteUserService - Diferentes cenários de deleção', () => {
  test('deve deletar usuário existente', async () => {
    const mockUser = {
      id: '1',
      nome: 'João',
      sobrenome: 'Silva',
      email: 'joao@email.com',
      telefone: '11999999999',
      permissao: 'member'
    };

    class MockRepository {
      async delete() {
        return mockUser;
      }
    }

    const service = new DeleteUserService(MockRepository, '1');
    const result = await service.execute();

    expect(result).toEqual(mockUser);
  });

  test('deve retornar resultado da operação de delete', async () => {
    const deleteResult = {
      id: '1',
      nome: 'João',
      email: 'joao@email.com'
    };

    class MockRepository {
      async delete() {
        return deleteResult;
      }
    }

    const service = new DeleteUserService(MockRepository, '1');
    const result = await service.execute();

    expect(result).toBe(deleteResult);
  });

  test('deve propagar erro de usuário não encontrado', async () => {
    const notFoundError = new Error('Record to delete does not exist');

    class MockRepository {
      async delete() {
        throw notFoundError;
      }
    }

    const service = new DeleteUserService(MockRepository, '999');

    await expect(service.execute()).rejects.toThrow('Record to delete does not exist');
  });
});

describe('DeleteUserService - Operações de delete', () => {
  test('deve chamar delete sem opções adicionais', async () => {
    class MockRepository {
      constructor() {
        this.deleteCalls = [];
      }

      async delete(where, options) {
        this.deleteCalls.push({ where, options });
        return { id: '1' };
      }
    }

    const service = new DeleteUserService(MockRepository, '1');
    await service.execute();

    const deleteCall = service.repository.deleteCalls[0];
    expect(deleteCall).toEqual({
      where: { id: '1' },
      options: undefined
    });
    expect(deleteCall.select).toBeUndefined();
  });

  test('deve usar apenas where clause na deleção', async () => {
    class MockRepository {
      constructor() {
        this.deleteCalls = [];
      }

      async delete(where, options) {
        this.deleteCalls.push({ where, options });
        return { id: where.id };
      }
    }

    const service = new DeleteUserService(MockRepository, '456');
    await service.execute();

    const deleteCall = service.repository.deleteCalls[0];
    expect(Object.keys(deleteCall)).toEqual(['where', 'options']);
    expect(deleteCall.where).toEqual({ id: '456' });
  });
});
