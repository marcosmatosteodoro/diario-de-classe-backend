import { IsAlunoEmailExistsService } from '../../../../src/services/aluno/isAlunoEmailExistsService.js';
import AlunoRepository from '../../../../src/repositories/alunoRepository.js';
import AbstractService from '../../../../src/services/abstractService.js';

describe('IsAlunoEmailExistsService', () => {
  // Initialization tests
});

describe('IsAlunoEmailExistsService - Inicialização', () => {
  test('deve criar uma instância com repositório padrão e email', () => {
    const email = 'test@example.com';
    const service = new IsAlunoEmailExistsService(AlunoRepository, email);

    expect(service).toBeInstanceOf(IsAlunoEmailExistsService);
    expect(service).toBeInstanceOf(AbstractService);
    expect(service.repository).toBeInstanceOf(AlunoRepository);
    expect(service.email).toBe(email);
  });

  test('deve criar uma instância com repositório customizado e email', () => {
    class MockRepository {
      constructor() {
        this.selectOne = () => Promise.resolve({});
      }
    }

    const email = 'custom@test.com';
    const service = new IsAlunoEmailExistsService(MockRepository, email);

    expect(service).toBeInstanceOf(IsAlunoEmailExistsService);
    expect(service).toBeInstanceOf(AbstractService);
    expect(service.repository).toBeInstanceOf(MockRepository);
    expect(service.email).toBe(email);
  });

  test('deve herdar de AbstractService', () => {
    expect(Object.getPrototypeOf(IsAlunoEmailExistsService)).toBe(AbstractService);
  });

  test('deve armazenar o email fornecido', () => {
    const email = 'store@test.com';
    const service = new IsAlunoEmailExistsService(AlunoRepository, email);

    expect(service.email).toBe(email);
  });

  test('deve aceitar email como string vazia', () => {
    const service = new IsAlunoEmailExistsService(AlunoRepository, '');

    expect(service.email).toBe('');
  });

  test('deve aceitar email como null', () => {
    const service = new IsAlunoEmailExistsService(AlunoRepository, null);

    expect(service.email).toBeNull();
  });

  test('deve aceitar email como undefined', () => {
    const service = new IsAlunoEmailExistsService(AlunoRepository, undefined);

    expect(service.email).toBeUndefined();
  });
});

describe('IsAlunoEmailExistsService - Método execute()', () => {
  test('deve existir e ser uma função assíncrona', () => {
    const service = new IsAlunoEmailExistsService(AlunoRepository, 'test@example.com');

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
        return { id: 'aluno123' };
      }
    }

    const email = 'verify@test.com';
    const service = new IsAlunoEmailExistsService(MockRepository, email);
    await service.execute();

    expect(service.repository.selectOneCalls).toHaveLength(1);
    expect(service.repository.selectOneCalls[0]).toEqual({
      where: { email: email },
      select: { id: true }
    });
  });

  test('deve retornar true quando aluno existe', async () => {
    class MockRepository {
      async selectOne() {
        return { id: 'aluno123' };
      }
    }

    const service = new IsAlunoEmailExistsService(MockRepository, 'exists@test.com');
    const result = await service.execute();

    expect(result).toBe(true);
  });

  test('deve retornar false quando aluno não existe', async () => {
    class MockRepository {
      async selectOne() {
        return null;
      }
    }

    const service = new IsAlunoEmailExistsService(MockRepository, 'notexists@test.com');
    const result = await service.execute();

    expect(result).toBe(false);
  });

  test('deve retornar false quando repository retorna undefined', async () => {
    class MockRepository {
      async selectOne() {
        return undefined;
      }
    }

    const service = new IsAlunoEmailExistsService(MockRepository, 'undefined@test.com');
    const result = await service.execute();

    expect(result).toBe(false);
  });

  test('deve retornar true quando repository retorna objeto vazio', async () => {
    class MockRepository {
      async selectOne() {
        return {};
      }
    }

    const service = new IsAlunoEmailExistsService(MockRepository, 'empty@test.com');
    const result = await service.execute();

    expect(result).toBe(true);
  });

  test('deve retornar false quando repository retorna string vazia', async () => {
    class MockRepository {
      async selectOne() {
        return '';
      }
    }

    const service = new IsAlunoEmailExistsService(MockRepository, 'string@test.com');
    const result = await service.execute();

    expect(result).toBe(false);
  });

  test('deve retornar false quando repository retorna número zero', async () => {
    class MockRepository {
      async selectOne() {
        return 0;
      }
    }

    const service = new IsAlunoEmailExistsService(MockRepository, 'zero@test.com');
    const result = await service.execute();

    expect(result).toBe(false);
  });

  test('deve propagar erro quando repository falha', async () => {
    class MockRepository {
      async selectOne() {
        throw new Error('Erro no banco de dados');
      }
    }

    const service = new IsAlunoEmailExistsService(MockRepository, 'error@test.com');

    await expect(service.execute()).rejects.toThrow('Erro no banco de dados');
  });

  test('deve funcionar com emails com diferentes formatos', async () => {
    class MockRepository {
      constructor() {
        this.selectOneCalls = [];
      }

      async selectOne(params) {
        this.selectOneCalls.push(params);
        return { id: 'aluno123' };
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
      const service = new IsAlunoEmailExistsService(MockRepository, email);
      const result = await service.execute();

      expect(result).toBe(true);
      expect(service.repository.selectOneCalls).toContainEqual({
        where: { email: email },
        select: { id: true }
      });
    }
  });
});

describe('IsAlunoEmailExistsService - Método estático handle()', () => {
  test('deve ter método handle estático definido', () => {
    expect(typeof IsAlunoEmailExistsService.handle).toBe('function');
    expect(IsAlunoEmailExistsService.handle.constructor.name).toBe('AsyncFunction');
  });

  test('deve usar repositório padrão AlunoRepository automaticamente', async () => {
    // Testa com email que não existe para retornar false
    const result = await IsAlunoEmailExistsService.handle('email-inexistente-teste@naoexiste.com');
    expect(result).toBe(false);
  });

  test('deve aceitar apenas email como parâmetro', async () => {
    // Verifica que o método funciona apenas com um parâmetro (email)
    const result = await IsAlunoEmailExistsService.handle('outro-email-inexistente@teste.com');
    expect(result).toBe(false);
  });

  test('deve funcionar com email vazio (retorna false pois é inválido)', async () => {
    const result = await IsAlunoEmailExistsService.handle('');
    expect(result).toBe(false);
  });
});

describe('IsAlunoEmailExistsService - Integração com AbstractService', () => {
  test('deve implementar método execute() abstrato', () => {
    const service = new IsAlunoEmailExistsService(AlunoRepository, 'test@example.com');

    expect(typeof service.execute).toBe('function');
    expect(service.execute).not.toBe(AbstractService.prototype.execute);
  });

  test('deve implementar método handle() estático', () => {
    expect(typeof IsAlunoEmailExistsService.handle).toBe('function');
    expect(IsAlunoEmailExistsService.handle).not.toBe(AbstractService.handle);
  });

  test('deve ter acesso ao repository através da classe pai', () => {
    const service = new IsAlunoEmailExistsService(AlunoRepository, 'test@example.com');

    expect(service.repository).toBeDefined();
    expect(service.repository).toBeInstanceOf(AlunoRepository);
  });

  test('deve ser uma subclasse de AbstractService', () => {
    const service = new IsAlunoEmailExistsService(AlunoRepository, 'test@example.com');

    expect(service instanceof AbstractService).toBe(true);
    expect(service instanceof IsAlunoEmailExistsService).toBe(true);
  });
});

describe('IsAlunoEmailExistsService - Validação de query do banco', () => {
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
    const service = new IsAlunoEmailExistsService(MockRepository, email);
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

    const service = new IsAlunoEmailExistsService(MockRepository, 'select@test.com');
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
        return { id: 'aluno123' };
      }
    }

    const service = new IsAlunoEmailExistsService(MockRepository, 'single@test.com');
    await service.execute();

    expect(service.repository.selectOneCalls).toHaveLength(1);
  });
});

describe('IsAlunoEmailExistsService - Casos extremos', () => {
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
    const service = new IsAlunoEmailExistsService(MockRepository, longEmail);
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
        return { id: 'aluno123' };
      }
    }

    const specialEmail = 'test+special-chars_123@example-domain.co.uk';
    const service = new IsAlunoEmailExistsService(MockRepository, specialEmail);
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
    const service = new IsAlunoEmailExistsService(MockRepository, upperEmail);
    await service.execute();

    expect(service.repository.selectOneCalls[0].where.email).toBe(upperEmail);
  });
});

describe('IsAlunoEmailExistsService - Conversão Boolean', () => {
  test('deve converter objetos truthy para true', async () => {
    const truthyValues = [
      { id: 'aluno123' },
      { id: 'aluno123', nome: 'Test' },
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

      const service = new IsAlunoEmailExistsService(MockRepository, 'test@example.com');
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

      const service = new IsAlunoEmailExistsService(MockRepository, 'test@example.com');
      const result = await service.execute();

      expect(result).toBe(Boolean(value));
    }
  });
});

describe('IsAlunoEmailExistsService - Cenários específicos do modelo Aluno', () => {
  test('deve verificar existência de email com diferentes casos de alunos', async () => {
    const alunoEmails = [
      'joao.silva@escola.com',
      'maria.santos@escola.com',
      'pedro.costa@escola.com',
      'ana.oliveira@escola.com'
    ];

    class MockRepository {
      constructor() {
        this.selectOneCalls = [];
      }

      async selectOne(params) {
        this.selectOneCalls.push(params);
        // Simula que alguns emails existem
        const existingEmails = ['joao.silva@escola.com', 'maria.santos@escola.com'];
        return existingEmails.includes(params.where.email) ? { id: 'aluno123' } : null;
      }
    }

    for (const email of alunoEmails) {
      const service = new IsAlunoEmailExistsService(MockRepository, email);
      const result = await service.execute();

      const shouldExist = ['joao.silva@escola.com', 'maria.santos@escola.com'].includes(email);
      expect(result).toBe(shouldExist);
    }
  });

  test('deve funcionar com emails de alunos em diferentes formatos educacionais', async () => {
    class MockRepository {
      constructor() {
        this.selectOneCalls = [];
      }

      async selectOne(params) {
        this.selectOneCalls.push(params);
        return { id: 'aluno123' };
      }
    }

    const educationalEmails = [
      'aluno123@escola.edu.br',
      'student@university.ac.uk',
      'estudante@faculdade.org',
      'matricula2023@instituto.gov.br'
    ];

    for (const email of educationalEmails) {
      const service = new IsAlunoEmailExistsService(MockRepository, email);
      const result = await service.execute();

      expect(result).toBe(true);
      expect(service.repository.selectOneCalls).toContainEqual({
        where: { email: email },
        select: { id: true }
      });
    }
  });

  test('deve verificar unicidade de email no contexto de alunos', async () => {
    class MockRepository {
      constructor() {
        this.selectOneCalls = [];
      }

      async selectOne(params) {
        this.selectOneCalls.push(params);
        // Simula comportamento de unicidade - apenas um resultado
        return params.where.email === 'unico@test.com' ? { id: 'aluno-unico' } : null;
      }
    }

    // Testa email único existente
    const serviceExistente = new IsAlunoEmailExistsService(MockRepository, 'unico@test.com');
    const resultExistente = await serviceExistente.execute();
    expect(resultExistente).toBe(true);

    // Testa email não existente
    const serviceInexistente = new IsAlunoEmailExistsService(MockRepository, 'nao-existe@test.com');
    const resultInexistente = await serviceInexistente.execute();
    expect(resultInexistente).toBe(false);
  });
});
