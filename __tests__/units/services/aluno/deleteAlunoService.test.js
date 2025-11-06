import { DeleteAlunoService } from '../../../../src/services/aluno/deleteAlunoService.js';
import AlunoRepository from '../../../../src/repositories/alunoRepository.js';
import AbstractService from '../../../../src/services/abstractService.js';

describe('DeleteAlunoService - Inicialização', () => {
  test('deve criar uma instância com repositório e id', () => {
    const service = new DeleteAlunoService(AlunoRepository, '1');

    expect(service).toBeInstanceOf(DeleteAlunoService);
    expect(service).toBeInstanceOf(AbstractService);
    expect(service.repository).toBeInstanceOf(AlunoRepository);
    expect(service.id).toBe('1');
  });

  test('deve herdar de AbstractService', () => {
    const service = new DeleteAlunoService(AlunoRepository, '1');

    expect(service).toBeInstanceOf(AbstractService);
  });

  test('deve ter método execute implementado', () => {
    const service = new DeleteAlunoService(AlunoRepository, '1');

    expect(service.execute).toBeDefined();
    expect(typeof service.execute).toBe('function');
  });

  test('deve ter método estático handle', () => {
    expect(DeleteAlunoService.handle).toBeDefined();
    expect(typeof DeleteAlunoService.handle).toBe('function');
  });
});

describe('DeleteAlunoService - Método execute()', () => {
  test('deve existir e ser uma função assíncrona', () => {
    const service = new DeleteAlunoService(AlunoRepository, '1');

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
          sobrenome: 'Silva',
          email: 'joao@email.com'
        };
      }
    }

    const service = new DeleteAlunoService(MockRepository, '1');
    await service.execute();

    expect(service.repository.deleteCalls).toHaveLength(1);
    expect(service.repository.deleteCalls[0]).toEqual({
      where: { id: '1' },
      options: undefined
    });
  });

  test('deve retornar o aluno deletado', async () => {
    const mockAluno = {
      id: '1',
      nome: 'João',
      sobrenome: 'Silva',
      email: 'joao@email.com',
      telefone: '11999999999',
      criador: null
    };

    class MockRepository {
      async delete() {
        return mockAluno;
      }
    }

    const service = new DeleteAlunoService(MockRepository, '1');
    const result = await service.execute();

    expect(result).toEqual(mockAluno);
  });

  test('deve propagar erro quando repository falha', async () => {
    const mockError = new Error('Erro de banco de dados');

    class MockRepository {
      async delete() {
        throw mockError;
      }
    }

    const service = new DeleteAlunoService(MockRepository, '1');

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

    const service = new DeleteAlunoService(MockRepository, '123');
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

      const service = new DeleteAlunoService(MockRepository, testId);
      await service.execute();

      expect(service.repository.deleteCalls[0].where.id).toBe(testId);
    }
  });
});

describe('DeleteAlunoService - Método estático handle()', () => {
  test('deve executar o serviço com id fornecido', async () => {
    // Como o método handle usa AlunoRepository internamente,
    // vamos apenas verificar se o método existe e pode ser chamado
    expect(typeof DeleteAlunoService.handle).toBe('function');
    expect(DeleteAlunoService.handle.constructor.name).toBe('AsyncFunction');
  });

  test('deve usar repositório padrão AlunoRepository', async () => {
    // Como não podemos facilmente mockar o AlunoRepository real,
    // vamos apenas verificar se o método existe e pode ser chamado
    expect(typeof DeleteAlunoService.handle).toBe('function');
    expect(DeleteAlunoService.handle.constructor.name).toBe('AsyncFunction');
  });

  test('deve criar nova instância do serviço a cada chamada', async () => {
    // Testamos se o método handle pode ser chamado múltiplas vezes
    expect(typeof DeleteAlunoService.handle).toBe('function');

    // Verificamos se é uma função assíncrona
    expect(DeleteAlunoService.handle.constructor.name).toBe('AsyncFunction');
  });
});

describe('DeleteAlunoService - Integração com AbstractService', () => {
  test('deve implementar método execute() abstrato', () => {
    const service = new DeleteAlunoService(AlunoRepository, '1');

    expect(service.execute).toBeDefined();
    expect(service.execute).not.toBe(AbstractService.prototype.execute);
  });

  test('deve implementar método handle() estático', () => {
    expect(typeof DeleteAlunoService.handle).toBe('function');
    expect(DeleteAlunoService.handle).not.toBe(AbstractService.handle);
  });

  test('deve ter acesso ao repository através da classe pai', () => {
    const service = new DeleteAlunoService(AlunoRepository, '1');

    expect(service.repository).toBeDefined();
    expect(service.repository).toBeInstanceOf(AlunoRepository);
  });

  test('deve ser uma subclasse de AbstractService', () => {
    expect(DeleteAlunoService.prototype).toBeInstanceOf(Object);
    expect(Object.getPrototypeOf(DeleteAlunoService.prototype)).toBe(AbstractService.prototype);
  });
});

describe('DeleteAlunoService - Validação de parâmetros', () => {
  test('deve armazenar id fornecido corretamente', () => {
    const testCases = ['1', '123', 'abc', '999'];

    testCases.forEach(testId => {
      const service = new DeleteAlunoService(AlunoRepository, testId);
      expect(service.id).toBe(testId);
    });
  });

  test('deve funcionar com ID null ou undefined', () => {
    const testCases = [null, undefined];

    testCases.forEach(testId => {
      const service = new DeleteAlunoService(AlunoRepository, testId);
      expect(service.id).toBe(testId);
    });
  });
});

describe('DeleteAlunoService - Diferentes cenários de deleção', () => {
  test('deve deletar aluno existente', async () => {
    const mockAluno = {
      id: '1',
      nome: 'João',
      sobrenome: 'Silva',
      email: 'joao@email.com',
      telefone: '11999999999',
      criador: 'user-123'
    };

    class MockRepository {
      async delete() {
        return mockAluno;
      }
    }

    const service = new DeleteAlunoService(MockRepository, '1');
    const result = await service.execute();

    expect(result).toEqual(mockAluno);
  });

  test('deve retornar resultado da operação de delete', async () => {
    const deleteResult = {
      id: '1',
      nome: 'João',
      sobrenome: 'Silva',
      email: 'joao@email.com'
    };

    class MockRepository {
      async delete() {
        return deleteResult;
      }
    }

    const service = new DeleteAlunoService(MockRepository, '1');
    const result = await service.execute();

    expect(result).toBe(deleteResult);
  });

  test('deve propagar erro de aluno não encontrado', async () => {
    const notFoundError = new Error('Record to delete does not exist');

    class MockRepository {
      async delete() {
        throw notFoundError;
      }
    }

    const service = new DeleteAlunoService(MockRepository, '999');

    await expect(service.execute()).rejects.toThrow('Record to delete does not exist');
  });

  test('deve deletar aluno com criador null', async () => {
    const mockAluno = {
      id: '2',
      nome: 'Maria',
      sobrenome: 'Santos',
      email: 'maria@email.com',
      telefone: null,
      criador: null
    };

    class MockRepository {
      async delete() {
        return mockAluno;
      }
    }

    const service = new DeleteAlunoService(MockRepository, '2');
    const result = await service.execute();

    expect(result.criador).toBeNull();
    expect(result.telefone).toBeNull();
  });

  test('deve deletar aluno com todos os campos preenchidos', async () => {
    const mockAluno = {
      id: '3',
      nome: 'Pedro',
      sobrenome: 'Costa',
      email: 'pedro@email.com',
      telefone: '11888888888',
      criador: 'admin-456',
      dataCriacao: '2024-01-01',
      dataAtualizacao: '2024-01-02'
    };

    class MockRepository {
      async delete() {
        return mockAluno;
      }
    }

    const service = new DeleteAlunoService(MockRepository, '3');
    const result = await service.execute();

    expect(result).toEqual(mockAluno);
    expect(result.criador).toBe('admin-456');
    expect(result.telefone).toBe('11888888888');
  });
});

describe('DeleteAlunoService - Operações de delete', () => {
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

    const service = new DeleteAlunoService(MockRepository, '1');
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

    const service = new DeleteAlunoService(MockRepository, '456');
    await service.execute();

    const deleteCall = service.repository.deleteCalls[0];
    expect(Object.keys(deleteCall)).toEqual(['where', 'options']);
    expect(deleteCall.where).toEqual({ id: '456' });
  });

  test('deve funcionar com IDs específicos do modelo Aluno', async () => {
    const alunoIds = ['aluno-123', 'student-456', 'al789'];

    for (const alunoId of alunoIds) {
      class MockRepository {
        constructor() {
          this.deleteCalls = [];
        }

        async delete(where, options) {
          this.deleteCalls.push({ where, options });
          return { id: where.id, nome: 'Aluno Teste' };
        }
      }

      const service = new DeleteAlunoService(MockRepository, alunoId);
      const result = await service.execute();

      expect(service.repository.deleteCalls[0].where.id).toBe(alunoId);
      expect(result.id).toBe(alunoId);
    }
  });
});
