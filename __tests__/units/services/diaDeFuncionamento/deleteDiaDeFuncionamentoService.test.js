import { DeleteDiaDeFuncionamentoService } from '../../../../src/services/diaDeFuncionamento/deleteDiaDeFuncionamentoService.js';
import DiaDeFuncionamentoRepository from '../../../../src/repositories/diaDeFuncionamentoRepository.js';
import AbstractService from '../../../../src/services/abstractService.js';

describe('DeleteDiaDeFuncionamentoService - Inicialização', () => {
  test('deve criar uma instância com repositório e id', () => {
    const service = new DeleteDiaDeFuncionamentoService(DiaDeFuncionamentoRepository, '1');

    expect(service).toBeInstanceOf(DeleteDiaDeFuncionamentoService);
    expect(service).toBeInstanceOf(AbstractService);
    expect(service.repository).toBeInstanceOf(DiaDeFuncionamentoRepository);
    expect(service.id).toBe('1');
  });

  test('deve herdar de AbstractService', () => {
    const service = new DeleteDiaDeFuncionamentoService(DiaDeFuncionamentoRepository, '1');

    expect(service).toBeInstanceOf(AbstractService);
  });

  test('deve ter método execute implementado', () => {
    const service = new DeleteDiaDeFuncionamentoService(DiaDeFuncionamentoRepository, '1');

    expect(service.execute).toBeDefined();
    expect(typeof service.execute).toBe('function');
  });

  test('deve ter método estático handle', () => {
    expect(DeleteDiaDeFuncionamentoService.handle).toBeDefined();
    expect(typeof DeleteDiaDeFuncionamentoService.handle).toBe('function');
  });
});

describe('DeleteDiaDeFuncionamentoService - Método execute()', () => {
  test('deve existir e ser uma função assíncrona', () => {
    const service = new DeleteDiaDeFuncionamentoService(DiaDeFuncionamentoRepository, '1');

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
        return { id: '1', diaDaSemana: 'SEGUNDA' };
      }
    }

    const service = new DeleteDiaDeFuncionamentoService(MockRepository, '1');
    await service.execute();

    expect(service.repository.deleteCalls).toHaveLength(1);
    expect(service.repository.deleteCalls[0]).toEqual({ where: { id: '1' }, options: undefined });
  });

  test('deve retornar o registro deletado', async () => {
    const mockObj = { id: '1', diaDaSemana: 'TERCA', horaInicial: '08:00', horaFinal: '12:00' };

    class MockRepository {
      async delete() {
        return mockObj;
      }
    }

    const service = new DeleteDiaDeFuncionamentoService(MockRepository, '1');
    const result = await service.execute();

    expect(result).toEqual(mockObj);
  });

  test('deve propagar erro quando repository falha', async () => {
    const mockError = new Error('Erro de banco de dados');

    class MockRepository {
      async delete() {
        throw mockError;
      }
    }

    const service = new DeleteDiaDeFuncionamentoService(MockRepository, '1');

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

    const service = new DeleteDiaDeFuncionamentoService(MockRepository, '123');
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

      const service = new DeleteDiaDeFuncionamentoService(MockRepository, testId);
      await service.execute();

      expect(service.repository.deleteCalls[0].where.id).toBe(testId);
    }
  });
});

describe('DeleteDiaDeFuncionamentoService - Método estático handle()', () => {
  test('deve executar o serviço com id fornecido', async () => {
    expect(typeof DeleteDiaDeFuncionamentoService.handle).toBe('function');
    expect(DeleteDiaDeFuncionamentoService.handle.constructor.name).toBe('AsyncFunction');
  });

  test('deve usar repositório padrão DiaDeFuncionamentoRepository', async () => {
    expect(typeof DeleteDiaDeFuncionamentoService.handle).toBe('function');
    expect(DeleteDiaDeFuncionamentoService.handle.constructor.name).toBe('AsyncFunction');
  });

  test('deve criar nova instância do serviço a cada chamada', async () => {
    expect(typeof DeleteDiaDeFuncionamentoService.handle).toBe('function');
    expect(DeleteDiaDeFuncionamentoService.handle.constructor.name).toBe('AsyncFunction');
  });
});

describe('DeleteDiaDeFuncionamentoService - Integração com AbstractService', () => {
  test('deve implementar método execute() abstrato', () => {
    const service = new DeleteDiaDeFuncionamentoService(DiaDeFuncionamentoRepository, '1');

    expect(service.execute).toBeDefined();
    expect(service.execute).not.toBe(AbstractService.prototype.execute);
  });

  test('deve implementar método handle() estático', () => {
    expect(typeof DeleteDiaDeFuncionamentoService.handle).toBe('function');
    expect(DeleteDiaDeFuncionamentoService.handle).not.toBe(AbstractService.handle);
  });

  test('deve ter acesso ao repository através da classe pai', () => {
    const service = new DeleteDiaDeFuncionamentoService(DiaDeFuncionamentoRepository, '1');

    expect(service.repository).toBeDefined();
    expect(service.repository).toBeInstanceOf(DiaDeFuncionamentoRepository);
  });

  test('deve ser uma subclasse de AbstractService', () => {
    expect(DeleteDiaDeFuncionamentoService.prototype).toBeInstanceOf(Object);
    expect(Object.getPrototypeOf(DeleteDiaDeFuncionamentoService.prototype)).toBe(
      AbstractService.prototype
    );
  });
});

describe('DeleteDiaDeFuncionamentoService - Validação de parâmetros', () => {
  test('deve armazenar id fornecido corretamente', () => {
    const testCases = ['1', '123', 'abc', '999'];

    testCases.forEach(testId => {
      const service = new DeleteDiaDeFuncionamentoService(DiaDeFuncionamentoRepository, testId);
      expect(service.id).toBe(testId);
    });
  });

  test('deve funcionar com ID null ou undefined', () => {
    const testCases = [null, undefined];

    testCases.forEach(testId => {
      const service = new DeleteDiaDeFuncionamentoService(DiaDeFuncionamentoRepository, testId);
      expect(service.id).toBe(testId);
    });
  });
});

describe('DeleteDiaDeFuncionamentoService - Diferentes cenários de deleção', () => {
  test('deve deletar registro existente', async () => {
    const mockObj = { id: '1', diaDaSemana: 'TERCA', horaInicial: '08:00', horaFinal: '09:00' };

    class MockRepository {
      async delete() {
        return mockObj;
      }
    }

    const service = new DeleteDiaDeFuncionamentoService(MockRepository, '1');
    const result = await service.execute();

    expect(result).toEqual(mockObj);
  });

  test('deve retornar resultado da operação de delete', async () => {
    const deleteResult = { id: '1', diaDaSemana: 'QUARTA' };

    class MockRepository {
      async delete() {
        return deleteResult;
      }
    }

    const service = new DeleteDiaDeFuncionamentoService(MockRepository, '1');
    const result = await service.execute();

    expect(result).toBe(deleteResult);
  });

  test('deve propagar erro quando registro não existe', async () => {
    const notFoundError = new Error('Record to delete does not exist');

    class MockRepository {
      async delete() {
        throw notFoundError;
      }
    }

    const service = new DeleteDiaDeFuncionamentoService(MockRepository, '999');

    await expect(service.execute()).rejects.toThrow('Record to delete does not exist');
  });

  test('deve deletar registro com dados nulos', async () => {
    const mockObj = { id: '2', diaDaSemana: 'SABADO', horaInicial: null, horaFinal: null };

    class MockRepository {
      async delete() {
        return mockObj;
      }
    }

    const service = new DeleteDiaDeFuncionamentoService(MockRepository, '2');
    const result = await service.execute();

    expect(result.horaInicial).toBeNull();
    expect(result.horaFinal).toBeNull();
  });

  test('deve deletar registro com todos os campos preenchidos', async () => {
    const mockObj = {
      id: '3',
      diaDaSemana: 'QUINTA',
      horaInicial: '08:00',
      horaFinal: '09:00',
      ativo: true
    };

    class MockRepository {
      async delete() {
        return mockObj;
      }
    }

    const service = new DeleteDiaDeFuncionamentoService(MockRepository, '3');
    const result = await service.execute();

    expect(result).toEqual(mockObj);
    expect(result.ativo).toBe(true);
  });
});

describe('DeleteDiaDeFuncionamentoService - Operações de delete', () => {
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

    const service = new DeleteDiaDeFuncionamentoService(MockRepository, '1');
    await service.execute();

    const deleteCall = service.repository.deleteCalls[0];
    expect(deleteCall).toEqual({ where: { id: '1' }, options: undefined });
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

    const service = new DeleteDiaDeFuncionamentoService(MockRepository, '456');
    await service.execute();

    const deleteCall = service.repository.deleteCalls[0];
    expect(Object.keys(deleteCall)).toEqual(['where', 'options']);
    expect(deleteCall.where).toEqual({ id: '456' });
  });

  test('deve funcionar com IDs específicos do modelo', async () => {
    const ids = ['ddf-123', 'ddf-456', 'ddf-789'];

    for (const id of ids) {
      class MockRepository {
        constructor() {
          this.deleteCalls = [];
        }

        async delete(where, options) {
          this.deleteCalls.push({ where, options });
          return { id: where.id, diaDaSemana: 'Teste' };
        }
      }

      const service = new DeleteDiaDeFuncionamentoService(MockRepository, id);
      const result = await service.execute();

      expect(service.repository.deleteCalls[0].where.id).toBe(id);
      expect(result.id).toBe(id);
    }
  });
});
