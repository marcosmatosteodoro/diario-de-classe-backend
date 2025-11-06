import { GetAlunoService } from '../../../../src/services/aluno/getAlunoService.js';
import AlunoRepository from '../../../../src/repositories/alunoRepository.js';
import AbstractService from '../../../../src/services/abstractService.js';

describe('GetAlunoService', () => {
  // Initialization tests
});

describe('GetAlunoService - Inicialização', () => {
  test('deve criar uma instância com repositório padrão e id', () => {
    const service = new GetAlunoService(AlunoRepository, 'aluno-id-1');

    expect(service).toBeInstanceOf(GetAlunoService);
    expect(service).toBeInstanceOf(AbstractService);
    expect(service.repository).toBeInstanceOf(AlunoRepository);
    expect(service.id).toBe('aluno-id-1');
  });

  test('deve criar uma instância com repositório customizado e id', () => {
    class MockRepository {
      constructor() {
        this.selectOne = () => Promise.resolve({});
      }
    }

    const service = new GetAlunoService(MockRepository, 'aluno-id-2');

    expect(service).toBeInstanceOf(GetAlunoService);
    expect(service).toBeInstanceOf(AbstractService);
    expect(service.repository).toBeInstanceOf(MockRepository);
    expect(service.id).toBe('aluno-id-2');
  });

  test('deve herdar de AbstractService', () => {
    expect(Object.getPrototypeOf(GetAlunoService)).toBe(AbstractService);
  });

  test('deve armazenar o id fornecido', () => {
    const alunoId = 'aluno-id-123';
    const service = new GetAlunoService(AlunoRepository, alunoId);

    expect(service.id).toBe(alunoId);
  });
});

describe('GetAlunoService - Método execute()', () => {
  test('deve existir e ser uma função assíncrona', () => {
    const service = new GetAlunoService(AlunoRepository, 'aluno-id-1');

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
          criador: true,
          dataCriacao: true,
          dataAtualizacao: true
        };
      }

      async selectOne(params) {
        this.selectOneCalls.push(params);
        return {
          id: 'aluno-id-1',
          nome: 'João',
          sobrenome: 'Silva',
          email: 'joao@teste.com'
        };
      }
    }

    const service = new GetAlunoService(MockRepository, 'aluno-id-1');
    await service.execute();

    expect(service.repository.selectOneCalls).toHaveLength(1);
    expect(service.repository.selectOneCalls[0]).toEqual({
      where: { id: 'aluno-id-1' },
      select: service.repository.selectFields
    });
  });

  test('deve retornar o aluno encontrado', async () => {
    const mockAluno = {
      id: 'aluno-id-1',
      nome: 'João',
      sobrenome: 'Silva',
      email: 'joao@teste.com',
      telefone: '11999999999',
      criador: 'user-id-123',
      dataCriacao: new Date(),
      dataAtualizacao: new Date()
    };

    class MockRepository {
      async selectOne() {
        return mockAluno;
      }
    }

    const service = new GetAlunoService(MockRepository, 'aluno-id-1');
    const result = await service.execute();

    expect(result).toEqual(mockAluno);
  });

  test('deve retornar null quando aluno não existe', async () => {
    class MockRepository {
      async selectOne() {
        return null;
      }
    }

    const service = new GetAlunoService(MockRepository, 'aluno-not-found');
    const result = await service.execute();

    expect(result).toBeNull();
  });

  test('deve propagar erro quando repository falha', async () => {
    class MockRepository {
      async selectOne() {
        throw new Error('Erro no banco de dados');
      }
    }

    const service = new GetAlunoService(MockRepository, 'aluno-id-1');

    await expect(service.execute()).rejects.toThrow('Erro no banco de dados');
  });

  test('deve retornar aluno com criador null', async () => {
    const mockAluno = {
      id: 'aluno-id-2',
      nome: 'Maria',
      sobrenome: 'Santos',
      email: 'maria@teste.com',
      telefone: null,
      criador: null,
      dataCriacao: new Date(),
      dataAtualizacao: new Date()
    };

    class MockRepository {
      async selectOne() {
        return mockAluno;
      }
    }

    const service = new GetAlunoService(MockRepository, 'aluno-id-2');
    const result = await service.execute();

    expect(result).toEqual(mockAluno);
    expect(result.criador).toBeNull();
    expect(result.telefone).toBeNull();
  });
});

describe('GetAlunoService - Método estático handle()', () => {
  test('deve ter método handle estático definido', () => {
    expect(typeof GetAlunoService.handle).toBe('function');
    expect(GetAlunoService.handle.constructor.name).toBe('AsyncFunction');
  });

  test('deve usar repositório padrão AlunoRepository', async () => {
    // Este teste verifica que o método existe e usa o repositório real
    // Não podemos mockar facilmente o AlunoRepository real aqui
    expect(typeof GetAlunoService.handle).toBe('function');

    // Testa com um ID que não existe para não modificar dados reais
    const result = await GetAlunoService.handle('id-inexistente-teste');
    expect(result).toBeNull();
  });

  test('deve aceitar apenas id como parâmetro', async () => {
    // Verifica que o método funciona apenas com ID
    const result = await GetAlunoService.handle('id-inexistente-teste-2');
    expect(result).toBeNull();
  });
});

describe('GetAlunoService - Integração com AbstractService', () => {
  test('deve implementar método execute() abstrato', () => {
    const service = new GetAlunoService(AlunoRepository, 'aluno-id-1');

    expect(typeof service.execute).toBe('function');
    expect(service.execute).not.toBe(AbstractService.prototype.execute);
  });

  test('deve implementar método handle() estático', () => {
    expect(typeof GetAlunoService.handle).toBe('function');
    expect(GetAlunoService.handle).not.toBe(AbstractService.handle);
  });

  test('deve ter acesso ao repository através da classe pai', () => {
    const service = new GetAlunoService(AlunoRepository, 'aluno-id-1');

    expect(service.repository).toBeDefined();
    expect(service.repository).toBeInstanceOf(AlunoRepository);
  });

  test('deve ser uma subclasse de AbstractService', () => {
    const service = new GetAlunoService(AlunoRepository, 'aluno-id-1');

    expect(service instanceof AbstractService).toBe(true);
    expect(service instanceof GetAlunoService).toBe(true);
  });
});

describe('GetAlunoService - Validação de campos selecionados', () => {
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
          criador: true,
          dataCriacao: true,
          dataAtualizacao: true
        };
      }

      async selectOne(params) {
        this.selectOneCalls.push(params);
        return {};
      }
    }

    const service = new GetAlunoService(MockRepository, 'aluno-id-1');
    await service.execute();

    const selectCall = service.repository.selectOneCalls[0];
    const expectedFields = [
      'id',
      'nome',
      'sobrenome',
      'email',
      'telefone',
      'criador',
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
          criador: true,
          dataCriacao: true,
          dataAtualizacao: true
        };
      }

      async selectOne(params) {
        this.selectOneCalls.push(params);
        return {};
      }
    }

    const alunoId = 'aluno-id-42';
    const service = new GetAlunoService(MockRepository, alunoId);
    await service.execute();

    const selectCall = service.repository.selectOneCalls[0];
    expect(selectCall.where).toEqual({ id: alunoId });
  });

  test('deve incluir campos específicos do modelo Aluno', async () => {
    class MockRepository {
      constructor() {
        this.selectOneCalls = [];
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

      async selectOne(params) {
        this.selectOneCalls.push(params);
        return {};
      }
    }

    const service = new GetAlunoService(MockRepository, 'aluno-id-1');
    await service.execute();

    const selectCall = service.repository.selectOneCalls[0];

    // Campos específicos do modelo Aluno
    expect(selectCall.select.sobrenome).toBe(true);
    expect(selectCall.select.telefone).toBe(true);
    expect(selectCall.select.criador).toBe(true);

    // Campos que não devem existir no modelo Aluno (diferente do User)
    expect(selectCall.select.senha).toBeUndefined();
    expect(selectCall.select.resetarSenha).toBeUndefined();
    expect(selectCall.select.permissao).toBeUndefined();
  });
});

describe('GetAlunoService - Diferentes tipos de ID', () => {
  test('deve funcionar com ID string', () => {
    const service = new GetAlunoService(AlunoRepository, 'aluno-id-123');
    expect(service.id).toBe('aluno-id-123');
  });

  test('deve funcionar com ID cuid', () => {
    const service = new GetAlunoService(AlunoRepository, 'cmhj1234567890abcdef');
    expect(service.id).toBe('cmhj1234567890abcdef');
  });

  test('deve funcionar com ID undefined', () => {
    const service = new GetAlunoService(AlunoRepository, undefined);
    expect(service.id).toBeUndefined();
  });

  test('deve funcionar com ID null', () => {
    const service = new GetAlunoService(AlunoRepository, null);
    expect(service.id).toBeNull();
  });

  test('deve funcionar com IDs específicos do modelo Aluno', () => {
    const alunoIds = ['student-123', 'al_456', 'aluno-789'];

    alunoIds.forEach(alunoId => {
      const service = new GetAlunoService(AlunoRepository, alunoId);
      expect(service.id).toBe(alunoId);
    });
  });
});

describe('GetAlunoService - Cenários específicos do modelo Aluno', () => {
  test('deve retornar aluno com todos os campos preenchidos', async () => {
    const mockAluno = {
      id: 'aluno-id-3',
      nome: 'Pedro',
      sobrenome: 'Costa',
      email: 'pedro@teste.com',
      telefone: '11888888888',
      criador: 'admin-456',
      dataCriacao: new Date('2024-01-01'),
      dataAtualizacao: new Date('2024-01-02')
    };

    class MockRepository {
      constructor() {
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

      async selectOne() {
        return mockAluno;
      }
    }

    const service = new GetAlunoService(MockRepository, 'aluno-id-3');
    const result = await service.execute();

    expect(result).toEqual(mockAluno);
    expect(result.sobrenome).toBe('Costa');
    expect(result.telefone).toBe('11888888888');
    expect(result.criador).toBe('admin-456');
  });

  test('deve retornar aluno com campos opcionais null', async () => {
    const mockAluno = {
      id: 'aluno-id-4',
      nome: 'Ana',
      sobrenome: 'Oliveira',
      email: 'ana@teste.com',
      telefone: null,
      criador: null,
      dataCriacao: new Date('2024-01-01'),
      dataAtualizacao: new Date('2024-01-01')
    };

    class MockRepository {
      constructor() {
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

      async selectOne() {
        return mockAluno;
      }
    }

    const service = new GetAlunoService(MockRepository, 'aluno-id-4');
    const result = await service.execute();

    expect(result).toEqual(mockAluno);
    expect(result.telefone).toBeNull();
    expect(result.criador).toBeNull();
    expect(result.nome).toBe('Ana');
    expect(result.sobrenome).toBe('Oliveira');
  });
});
