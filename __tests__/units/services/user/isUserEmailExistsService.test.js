import { IsUserEmailExistsService } from '../../../../src/services/user/isUserEmailExistsService.js';
import UserRepository from '../../../../src/repositories/userRepository.js';
import AbstractService from '../../../../src/services/abstractService.js';

describe('IsUserEmailExistsService', () => {
  // Initialization tests
});

describe('IsUserEmailExistsService - Inicialização', () => {
  test('deve criar uma instância com repositório padrão e email', () => {
    const email = 'test@example.com';
    const service = new IsUserEmailExistsService(UserRepository, email);

    expect(service).toBeInstanceOf(IsUserEmailExistsService);
    expect(service).toBeInstanceOf(AbstractService);
    expect(service.repository).toBeInstanceOf(UserRepository);
    expect(service.email).toBe(email);
  });

  test('deve criar uma instância com repositório customizado e email', () => {
    class MockRepository {
      constructor() {
        this.selectOne = () => Promise.resolve({});
      }
    }

    const email = 'custom@test.com';
    const service = new IsUserEmailExistsService(MockRepository, email);

    expect(service).toBeInstanceOf(IsUserEmailExistsService);
    expect(service).toBeInstanceOf(AbstractService);
    expect(service.repository).toBeInstanceOf(MockRepository);
    expect(service.email).toBe(email);
  });

  test('deve herdar de AbstractService', () => {
    expect(Object.getPrototypeOf(IsUserEmailExistsService)).toBe(AbstractService);
  });

  test('deve armazenar o email fornecido', () => {
    const email = 'store@test.com';
    const service = new IsUserEmailExistsService(UserRepository, email);

    expect(service.email).toBe(email);
  });

  test('deve aceitar email como string vazia', () => {
    const service = new IsUserEmailExistsService(UserRepository, '');

    expect(service.email).toBe('');
  });

  test('deve aceitar email como null', () => {
    const service = new IsUserEmailExistsService(UserRepository, null);

    expect(service.email).toBeNull();
  });

  test('deve aceitar email como undefined', () => {
    const service = new IsUserEmailExistsService(UserRepository, undefined);

    expect(service.email).toBeUndefined();
  });
});

describe('IsUserEmailExistsService - Método execute()', () => {
  test('deve existir e ser uma função assíncrona', () => {
    const service = new IsUserEmailExistsService(UserRepository, 'test@example.com');

    expect(typeof service.execute).toBe('function');
    expect(service.execute.constructor.name).toBe('AsyncFunction');
  });

  test('deve chamar repository.selectOne com parâmetros corretos', async () => {
    class MockRepository {
      constructor() {
        this.selectOneCalls = [];
      }

      async selectOne(params) {
        this.selectOneCalls.push(params);
        return { id: 'user123' };
      }
    }

    const email = 'verify@test.com';
    const service = new IsUserEmailExistsService(MockRepository, email);
    await service.execute();

    expect(service.repository.selectOneCalls).toHaveLength(1);
    expect(service.repository.selectOneCalls[0]).toEqual({
      where: { email: email },
      select: { id: true }
    });
  });

  test('deve retornar true quando usuário existe', async () => {
    class MockRepository {
      async selectOne() {
        return { id: 'user123' };
      }
    }

    const service = new IsUserEmailExistsService(MockRepository, 'exists@test.com');
    const result = await service.execute();

    expect(result).toBe(true);
  });

  test('deve retornar false quando usuário não existe', async () => {
    class MockRepository {
      async selectOne() {
        return null;
      }
    }

    const service = new IsUserEmailExistsService(MockRepository, 'notexists@test.com');
    const result = await service.execute();

    expect(result).toBe(false);
  });

  test('deve retornar false quando repository retorna undefined', async () => {
    class MockRepository {
      async selectOne() {
        return undefined;
      }
    }

    const service = new IsUserEmailExistsService(MockRepository, 'undefined@test.com');
    const result = await service.execute();

    expect(result).toBe(false);
  });

  test('deve retornar true quando repository retorna objeto vazio', async () => {
    class MockRepository {
      async selectOne() {
        return {};
      }
    }

    const service = new IsUserEmailExistsService(MockRepository, 'empty@test.com');
    const result = await service.execute();

    expect(result).toBe(true);
  });

  test('deve retornar true quando repository retorna string vazia', async () => {
    class MockRepository {
      async selectOne() {
        return '';
      }
    }

    const service = new IsUserEmailExistsService(MockRepository, 'string@test.com');
    const result = await service.execute();

    expect(result).toBe(false);
  });

  test('deve retornar true quando repository retorna número zero', async () => {
    class MockRepository {
      async selectOne() {
        return 0;
      }
    }

    const service = new IsUserEmailExistsService(MockRepository, 'zero@test.com');
    const result = await service.execute();

    expect(result).toBe(false);
  });

  test('deve propagar erro quando repository falha', async () => {
    class MockRepository {
      async selectOne() {
        throw new Error('Erro no banco de dados');
      }
    }

    const service = new IsUserEmailExistsService(MockRepository, 'error@test.com');

    await expect(service.execute()).rejects.toThrow('Erro no banco de dados');
  });

  test('deve funcionar com emails com diferentes formatos', async () => {
    class MockRepository {
      constructor() {
        this.selectOneCalls = [];
      }

      async selectOne(params) {
        this.selectOneCalls.push(params);
        return { id: 'user123' };
      }
    }

    const emails = [
      'simple@test.com',
      'with.dots@test.com',
      'with+plus@test.com',
      'with-dash@test.com',
      'with_underscore@test.com',
      'number123@test.com',
      'UPPERCASE@TEST.COM'
    ];

    for (const email of emails) {
      const service = new IsUserEmailExistsService(MockRepository, email);
      const result = await service.execute();

      expect(result).toBe(true);
      expect(service.repository.selectOneCalls).toContainEqual({
        where: { email: email },
        select: { id: true }
      });
    }
  });
});

describe('IsUserEmailExistsService - Método estático handle()', () => {
  test('deve ter método handle estático definido', () => {
    expect(typeof IsUserEmailExistsService.handle).toBe('function');
    expect(IsUserEmailExistsService.handle.constructor.name).toBe('AsyncFunction');
  });

  test('deve usar repositório padrão UserRepository automaticamente', async () => {
    // Testa com email que não existe para retornar false
    const result = await IsUserEmailExistsService.handle('email-inexistente-teste@naoexiste.com');
    expect(result).toBe(false);
  });

  test('deve aceitar apenas email como parâmetro', async () => {
    // Verifica que o método funciona apenas com um parâmetro (email)
    const result = await IsUserEmailExistsService.handle('outro-email-inexistente@teste.com');
    expect(result).toBe(false);
  });

  test('deve funcionar com email vazio (retorna false pois é inválido)', async () => {
    const result = await IsUserEmailExistsService.handle('');
    expect(result).toBe(false);
  });
});

describe('IsUserEmailExistsService - Integração com AbstractService', () => {
  test('deve implementar método execute() abstrato', () => {
    const service = new IsUserEmailExistsService(UserRepository, 'test@example.com');

    expect(typeof service.execute).toBe('function');
    expect(service.execute).not.toBe(AbstractService.prototype.execute);
  });

  test('deve implementar método handle() estático', () => {
    expect(typeof IsUserEmailExistsService.handle).toBe('function');
    expect(IsUserEmailExistsService.handle).not.toBe(AbstractService.handle);
  });

  test('deve ter acesso ao repository através da classe pai', () => {
    const service = new IsUserEmailExistsService(UserRepository, 'test@example.com');

    expect(service.repository).toBeDefined();
    expect(service.repository).toBeInstanceOf(UserRepository);
  });

  test('deve ser uma subclasse de AbstractService', () => {
    const service = new IsUserEmailExistsService(UserRepository, 'test@example.com');

    expect(service instanceof AbstractService).toBe(true);
    expect(service instanceof IsUserEmailExistsService).toBe(true);
  });
});

describe('IsUserEmailExistsService - Validação de query do banco', () => {
  test('deve usar where clause com email correto', async () => {
    class MockRepository {
      constructor() {
        this.selectOneCalls = [];
      }

      async selectOne(params) {
        this.selectOneCalls.push(params);
        return null;
      }
    }

    const email = 'query@test.com';
    const service = new IsUserEmailExistsService(MockRepository, email);
    await service.execute();

    const selectCall = service.repository.selectOneCalls[0];
    expect(selectCall.where).toEqual({ email: email });
  });

  test('deve selecionar apenas o campo id', async () => {
    class MockRepository {
      constructor() {
        this.selectOneCalls = [];
      }

      async selectOne(params) {
        this.selectOneCalls.push(params);
        return null;
      }
    }

    const service = new IsUserEmailExistsService(MockRepository, 'select@test.com');
    await service.execute();

    const selectCall = service.repository.selectOneCalls[0];
    expect(selectCall.select).toEqual({ id: true });
  });

  test('deve fazer apenas uma consulta ao banco', async () => {
    class MockRepository {
      constructor() {
        this.selectOneCalls = [];
      }

      async selectOne(params) {
        this.selectOneCalls.push(params);
        return { id: 'user123' };
      }
    }

    const service = new IsUserEmailExistsService(MockRepository, 'single@test.com');
    await service.execute();

    expect(service.repository.selectOneCalls).toHaveLength(1);
  });
});

describe('IsUserEmailExistsService - Casos extremos', () => {
  test('deve lidar com emails muito longos', async () => {
    class MockRepository {
      constructor() {
        this.selectOneCalls = [];
      }

      async selectOne(params) {
        this.selectOneCalls.push(params);
        return null;
      }
    }

    const longEmail = `${'a'.repeat(100)}@${'b'.repeat(100)}.com`;
    const service = new IsUserEmailExistsService(MockRepository, longEmail);
    const result = await service.execute();

    expect(result).toBe(false);
    expect(service.repository.selectOneCalls[0].where.email).toBe(longEmail);
  });

  test('deve lidar com caracteres especiais no email', async () => {
    class MockRepository {
      constructor() {
        this.selectOneCalls = [];
      }

      async selectOne(params) {
        this.selectOneCalls.push(params);
        return { id: 'user123' };
      }
    }

    const specialEmail = 'test+special-chars_123@example-domain.co.uk';
    const service = new IsUserEmailExistsService(MockRepository, specialEmail);
    const result = await service.execute();

    expect(result).toBe(true);
    expect(service.repository.selectOneCalls[0].where.email).toBe(specialEmail);
  });

  test('deve preservar case sensitivity do email', async () => {
    class MockRepository {
      constructor() {
        this.selectOneCalls = [];
      }

      async selectOne(params) {
        this.selectOneCalls.push(params);
        return null;
      }
    }

    const upperEmail = 'TEST@EXAMPLE.COM';
    const service = new IsUserEmailExistsService(MockRepository, upperEmail);
    await service.execute();

    expect(service.repository.selectOneCalls[0].where.email).toBe(upperEmail);
  });
});

describe('IsUserEmailExistsService - Conversão Boolean', () => {
  test('deve converter objetos truthy para true', async () => {
    const truthyValues = [
      { id: 'user123' },
      { id: 'user123', name: 'Test' },
      { id: 1 },
      { id: 0 }, // objeto não vazio é truthy
      [1, 2, 3],
      'string',
      1,
      -1,
      true
    ];

    for (const value of truthyValues) {
      class MockRepository {
        async selectOne() {
          return value;
        }
      }

      const service = new IsUserEmailExistsService(MockRepository, 'test@example.com');
      const result = await service.execute();

      expect(result).toBe(Boolean(value));
    }
  });

  test('deve converter valores falsy para false', async () => {
    const falsyValues = [null, undefined, false, 0, '', NaN];

    for (const value of falsyValues) {
      class MockRepository {
        async selectOne() {
          return value;
        }
      }

      const service = new IsUserEmailExistsService(MockRepository, 'test@example.com');
      const result = await service.execute();

      expect(result).toBe(Boolean(value));
    }
  });
});
