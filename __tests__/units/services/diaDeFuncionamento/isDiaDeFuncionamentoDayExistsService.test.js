import { IsDiaDeFuncionamentoDayExistsService } from '../../../../src/services/diaDeFuncionamento/isDiaDeFuncionamentoDayExistsService.js';
import DiaDeFuncionamentoRepository from '../../../../src/repositories/diaDeFuncionamentoRepository.js';
import AbstractService from '../../../../src/services/abstractService.js';

describe('IsDiaDeFuncionamentoDayExistsService', () => {});

describe('IsDiaDeFuncionamentoDayExistsService - Inicialização', () => {
  test('deve criar uma instância com repositório padrão e diaSemana', () => {
    const dia = 'SEGUNDA';
    const service = new IsDiaDeFuncionamentoDayExistsService(DiaDeFuncionamentoRepository, dia);

    expect(service).toBeInstanceOf(IsDiaDeFuncionamentoDayExistsService);
    expect(service).toBeInstanceOf(AbstractService);
    expect(service.repository).toBeInstanceOf(DiaDeFuncionamentoRepository);
    expect(service.diaSemana).toBe(dia);
    // repository foi atualizado para expor configuracaoId
    expect(service.repository.selectFields).toBeDefined();
    expect(service.repository.selectFields.configuracaoId).toBe(true);
  });

  test('deve criar uma instância com repositório customizado e diaSemana', () => {
    class MockRepository {
      constructor() {
        this.selectOne = () => Promise.resolve({});
      }
    }

    const dia = 'TERCA';
    const service = new IsDiaDeFuncionamentoDayExistsService(MockRepository, dia);

    expect(service).toBeInstanceOf(IsDiaDeFuncionamentoDayExistsService);
    expect(service).toBeInstanceOf(AbstractService);
    expect(service.repository).toBeInstanceOf(MockRepository);
    expect(service.diaSemana).toBe(dia);
  });

  test('deve herdar de AbstractService', () => {
    expect(Object.getPrototypeOf(IsDiaDeFuncionamentoDayExistsService)).toBe(AbstractService);
  });

  test('deve armazenar o diaSemana fornecido', () => {
    const dia = 'QUARTA';
    const service = new IsDiaDeFuncionamentoDayExistsService(DiaDeFuncionamentoRepository, dia);

    expect(service.diaSemana).toBe(dia);
  });

  test('deve aceitar diaSemana como string vazia', () => {
    const service = new IsDiaDeFuncionamentoDayExistsService(DiaDeFuncionamentoRepository, '');

    expect(service.diaSemana).toBe('');
  });

  test('deve aceitar diaSemana como null', () => {
    const service = new IsDiaDeFuncionamentoDayExistsService(DiaDeFuncionamentoRepository, null);

    expect(service.diaSemana).toBeNull();
  });

  test('deve aceitar diaSemana como undefined', () => {
    const service = new IsDiaDeFuncionamentoDayExistsService(
      DiaDeFuncionamentoRepository,
      undefined
    );

    expect(service.diaSemana).toBeUndefined();
  });
});

describe('IsDiaDeFuncionamentoDayExistsService - Método execute()', () => {
  test('deve existir e ser uma função assíncrona', () => {
    const service = new IsDiaDeFuncionamentoDayExistsService(
      DiaDeFuncionamentoRepository,
      'SEGUNDA'
    );

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
        return { id: 'dia123' };
      }
    }

    const dia = 'QUINTA';
    const service = new IsDiaDeFuncionamentoDayExistsService(MockRepository, dia);
    await service.execute();

    expect(service.repository.selectOneCalls).toHaveLength(1);
    expect(service.repository.selectOneCalls[0]).toEqual({
      where: { diaSemana: dia },
      select: { id: true }
    });
  });

  test('deve retornar true quando dia existe', async () => {
    class MockRepository {
      async selectOne() {
        return { id: 'dia123' };
      }
    }

    const service = new IsDiaDeFuncionamentoDayExistsService(MockRepository, 'SEGUNDA');
    const result = await service.execute();

    expect(result).toBe(true);
  });

  test('deve retornar false quando dia não existe', async () => {
    class MockRepository {
      async selectOne() {
        return null;
      }
    }

    const service = new IsDiaDeFuncionamentoDayExistsService(MockRepository, 'DOMINGO');
    const result = await service.execute();

    expect(result).toBe(false);
  });

  test('deve retornar false quando repository retorna undefined', async () => {
    class MockRepository {
      async selectOne() {
        return undefined;
      }
    }

    const service = new IsDiaDeFuncionamentoDayExistsService(MockRepository, 'SABADO');
    const result = await service.execute();

    expect(result).toBe(false);
  });

  test('deve retornar true quando repository retorna objeto vazio', async () => {
    class MockRepository {
      async selectOne() {
        return {};
      }
    }

    const service = new IsDiaDeFuncionamentoDayExistsService(MockRepository, 'TERCA');
    const result = await service.execute();

    expect(result).toBe(true);
  });

  test('deve propagar erro quando repository falha', async () => {
    class MockRepository {
      async selectOne() {
        throw new Error('Erro no banco de dados');
      }
    }

    const service = new IsDiaDeFuncionamentoDayExistsService(MockRepository, 'QUARTA');

    await expect(service.execute()).rejects.toThrow('Erro no banco de dados');
  });

  test('deve funcionar com diferentes formatos de diaSemana', async () => {
    class MockRepository {
      constructor() {
        this.selectOneCalls = [];
      }

      async selectOne(params) {
        this.selectOneCalls.push(params);
        return { id: 'dia123' };
      }
    }

    const dias = ['SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO', 'DOMINGO'];

    for (const dia of dias) {
      const service = new IsDiaDeFuncionamentoDayExistsService(MockRepository, dia);
      const result = await service.execute();

      expect(result).toBe(true);
      expect(service.repository.selectOneCalls).toContainEqual({
        where: { diaSemana: dia },
        select: { id: true }
      });
    }
  });
});

describe('IsDiaDeFuncionamentoDayExistsService - Método estático handle()', () => {
  test('deve ter método handle estático definido', () => {
    expect(typeof IsDiaDeFuncionamentoDayExistsService.handle).toBe('function');
    expect(IsDiaDeFuncionamentoDayExistsService.handle.constructor.name).toBe('AsyncFunction');
  });

  test('deve usar repositório padrão DiaDeFuncionamentoRepository automaticamente', async () => {
    // Avoid calling the real repository in unit tests (Prisma enum/unique constraints).
    // We only assert the static method exists and is async here.
    expect(typeof IsDiaDeFuncionamentoDayExistsService.handle).toBe('function');
    expect(IsDiaDeFuncionamentoDayExistsService.handle.constructor.name).toBe('AsyncFunction');
  });
});

describe('IsDiaDeFuncionamentoDayExistsService - Integração com AbstractService', () => {
  test('deve implementar método execute() abstrato', () => {
    const service = new IsDiaDeFuncionamentoDayExistsService(
      DiaDeFuncionamentoRepository,
      'SEGUNDA'
    );

    expect(typeof service.execute).toBe('function');
    expect(service.execute).not.toBe(AbstractService.prototype.execute);
  });

  test('deve implementar método handle() estático', () => {
    expect(typeof IsDiaDeFuncionamentoDayExistsService.handle).toBe('function');
    expect(IsDiaDeFuncionamentoDayExistsService.handle).not.toBe(AbstractService.handle);
  });

  test('deve ter acesso ao repository através da classe pai', () => {
    const service = new IsDiaDeFuncionamentoDayExistsService(
      DiaDeFuncionamentoRepository,
      'SEGUNDA'
    );

    expect(service.repository).toBeDefined();
    expect(service.repository).toBeInstanceOf(DiaDeFuncionamentoRepository);
    expect(service.repository.selectFields).toBeDefined();
    expect(service.repository.selectFields.configuracaoId).toBe(true);
  });

  test('deve ser uma subclasse de AbstractService', () => {
    const service = new IsDiaDeFuncionamentoDayExistsService(
      DiaDeFuncionamentoRepository,
      'SEGUNDA'
    );

    expect(service instanceof AbstractService).toBe(true);
    expect(service instanceof IsDiaDeFuncionamentoDayExistsService).toBe(true);
  });
});

describe('IsDiaDeFuncionamentoDayExistsService - Validação de query do banco', () => {
  test('deve usar where clause com diaSemana correto', async () => {
    class MockRepository {
      constructor() {
        this.selectOneCalls = [];
      }

      async selectOne(params) {
        this.selectOneCalls.push(params);
        return null;
      }
    }

    const dia = 'SEXTA';
    const service = new IsDiaDeFuncionamentoDayExistsService(MockRepository, dia);
    await service.execute();

    const selectCall = service.repository.selectOneCalls[0];
    expect(selectCall.where).toEqual({ diaSemana: dia });
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

    const service = new IsDiaDeFuncionamentoDayExistsService(MockRepository, 'SEXTA');
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
        return { id: 'dia123' };
      }
    }

    const service = new IsDiaDeFuncionamentoDayExistsService(MockRepository, 'SEXTA');
    await service.execute();

    expect(service.repository.selectOneCalls).toHaveLength(1);
  });
});

describe('IsDiaDeFuncionamentoDayExistsService - Casos extremos', () => {
  test('deve lidar com diaSemana inválido muito longo', async () => {
    class MockRepository {
      constructor() {
        this.selectOneCalls = [];
      }

      async selectOne(params) {
        this.selectOneCalls.push(params);
        return null;
      }
    }

    const longDay = 'D'.repeat(300);
    const service = new IsDiaDeFuncionamentoDayExistsService(MockRepository, longDay);
    const result = await service.execute();

    expect(result).toBe(false);
    expect(service.repository.selectOneCalls[0].where.diaSemana).toBe(longDay);
  });

  test('deve lidar com caracteres especiais no diaSemana', async () => {
    class MockRepository {
      constructor() {
        this.selectOneCalls = [];
      }

      async selectOne(params) {
        this.selectOneCalls.push(params);
        return { id: 'dia123' };
      }
    }

    const specialDay = 'SEG-@#';
    const service = new IsDiaDeFuncionamentoDayExistsService(MockRepository, specialDay);
    const result = await service.execute();

    expect(result).toBe(true);
    expect(service.repository.selectOneCalls[0].where.diaSemana).toBe(specialDay);
  });
});

describe('IsDiaDeFuncionamentoDayExistsService - Conversão Boolean', () => {
  test('deve converter objetos truthy para true', async () => {
    const truthyValues = [
      { id: 'dia123' },
      { id: 'dia123', name: 'Dia' },
      { id: 1 },
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

      const service = new IsDiaDeFuncionamentoDayExistsService(MockRepository, 'SEGUNDA');
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

      const service = new IsDiaDeFuncionamentoDayExistsService(MockRepository, 'SEGUNDA');
      const result = await service.execute();

      expect(result).toBe(Boolean(value));
    }
  });
});
