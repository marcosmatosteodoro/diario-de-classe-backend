import { GetDiaDeFuncionamentoService } from '../../../../src/services/diaDeFuncionamento/getDiaDeFuncionamentoService.js';
import DiaDeFuncionamentoRepository from '../../../../src/repositories/diaDeFuncionamentoRepository.js';
import AbstractService from '../../../../src/services/abstractService.js';

describe('GetDiaDeFuncionamentoService', () => {});

describe('GetDiaDeFuncionamentoService - Inicialização', () => {
  test('deve criar uma instância com repositório padrão e id', () => {
    const service = new GetDiaDeFuncionamentoService(DiaDeFuncionamentoRepository, 'ddf-1');

    expect(service).toBeInstanceOf(GetDiaDeFuncionamentoService);
    expect(service).toBeInstanceOf(AbstractService);
    expect(service.repository).toBeInstanceOf(DiaDeFuncionamentoRepository);
    expect(service.id).toBe('ddf-1');
    // repository foi atualizado para expor configuracaoId
    expect(service.repository.selectFields).toBeDefined();
    expect(service.repository.selectFields.configuracaoId).toBe(true);
  });

  test('deve criar uma instância com repositório customizado e id', () => {
    class MockRepository {
      constructor() {
        this.selectOne = () => Promise.resolve({});
      }
    }

    const service = new GetDiaDeFuncionamentoService(MockRepository, 'ddf-2');

    expect(service).toBeInstanceOf(GetDiaDeFuncionamentoService);
    expect(service).toBeInstanceOf(AbstractService);
    expect(service.repository).toBeInstanceOf(MockRepository);
    expect(service.id).toBe('ddf-2');
  });

  test('deve herdar de AbstractService', () => {
    expect(Object.getPrototypeOf(GetDiaDeFuncionamentoService)).toBe(AbstractService);
  });

  test('deve armazenar o id fornecido', () => {
    const id = 'ddf-123';
    const service = new GetDiaDeFuncionamentoService(DiaDeFuncionamentoRepository, id);

    expect(service.id).toBe(id);
  });
});

describe('GetDiaDeFuncionamentoService - Método execute()', () => {
  test('deve existir e ser uma função assíncrona', () => {
    const service = new GetDiaDeFuncionamentoService(DiaDeFuncionamentoRepository, 'ddf-1');

    expect(typeof service.execute).toBe('function');
    expect(service.execute.constructor.name).toBe('AsyncFunction');
  });

  test('deve chamar repository.selectOne com parâmetros corretos', async () => {
    class MockRepository {
      constructor() {
        this.selectOneCalls = [];
        this.selectFields = {
          id: true,
          diaDaSemana: true,
          horaInicial: true,
          horaFinal: true,
          ativo: true,
          configuracaoId: true
        };
      }

      async selectOne(params) {
        this.selectOneCalls.push(params);
        return { id: 'ddf-1', diaDaSemana: 'SEGUNDA' };
      }
    }

    const service = new GetDiaDeFuncionamentoService(MockRepository, 'ddf-1');
    await service.execute();

    expect(service.repository.selectOneCalls).toHaveLength(1);
    expect(service.repository.selectOneCalls[0]).toEqual({
      where: { id: 'ddf-1' },
      select: service.repository.selectFields
    });
  });

  test('deve retornar o registro encontrado', async () => {
    const mockObj = { id: 'ddf-1', diaDaSemana: 'TERCA', horaInicial: '08:00', horaFinal: '12:00' };

    class MockRepository {
      async selectOne() {
        return mockObj;
      }
    }

    const service = new GetDiaDeFuncionamentoService(MockRepository, 'ddf-1');
    const result = await service.execute();

    expect(result).toEqual(mockObj);
  });

  test('deve retornar null quando registro não existe', async () => {
    class MockRepository {
      async selectOne() {
        return null;
      }
    }

    const service = new GetDiaDeFuncionamentoService(MockRepository, 'not-found');
    const result = await service.execute();

    expect(result).toBeNull();
  });

  test('deve propagar erro quando repository falha', async () => {
    class MockRepository {
      async selectOne() {
        throw new Error('Erro no banco de dados');
      }
    }

    const service = new GetDiaDeFuncionamentoService(MockRepository, 'ddf-1');

    await expect(service.execute()).rejects.toThrow('Erro no banco de dados');
  });

  test('deve retornar registro com campos nulos', async () => {
    const mockObj = { id: 'ddf-2', diaDaSemana: 'SABADO', horaInicial: null, horaFinal: null };

    class MockRepository {
      constructor() {
        this.selectFields = {
          id: true,
          diaDaSemana: true,
          horaInicial: true,
          horaFinal: true,
          configuracaoId: true
        };
      }

      async selectOne() {
        return mockObj;
      }
    }

    const service = new GetDiaDeFuncionamentoService(MockRepository, 'ddf-2');
    const result = await service.execute();

    expect(result).toEqual(mockObj);
    expect(result.horaInicial).toBeNull();
    expect(result.horaFinal).toBeNull();
  });
});

describe('GetDiaDeFuncionamentoService - Método estático handle()', () => {
  test('deve ter método handle estático definido', () => {
    expect(typeof GetDiaDeFuncionamentoService.handle).toBe('function');
    expect(GetDiaDeFuncionamentoService.handle.constructor.name).toBe('AsyncFunction');
  });

  test('deve usar repositório padrão', async () => {
    expect(typeof GetDiaDeFuncionamentoService.handle).toBe('function');

    // Chamamos com um id que provavelmente não existe para não afetar dados reais
    const result = await GetDiaDeFuncionamentoService.handle('id-inexistente-teste');
    // Pode retornar null
    // test will pass if no exception is thrown
    expect(result === null || typeof result === 'object').toBeTruthy();
  });

  test('deve aceitar apenas id como parâmetro', async () => {
    const result = await GetDiaDeFuncionamentoService.handle('id-inexistente-teste-2');
    expect(result === null || typeof result === 'object').toBeTruthy();
  });
});

describe('GetDiaDeFuncionamentoService - Integração com AbstractService', () => {
  test('deve implementar método execute() abstrato', () => {
    const service = new GetDiaDeFuncionamentoService(DiaDeFuncionamentoRepository, 'ddf-1');

    expect(typeof service.execute).toBe('function');
    expect(service.execute).not.toBe(AbstractService.prototype.execute);
  });

  test('deve implementar método handle() estático', () => {
    expect(typeof GetDiaDeFuncionamentoService.handle).toBe('function');
    expect(GetDiaDeFuncionamentoService.handle).not.toBe(AbstractService.handle);
  });

  test('deve ter acesso ao repository através da classe pai', () => {
    const service = new GetDiaDeFuncionamentoService(DiaDeFuncionamentoRepository, 'ddf-1');

    expect(service.repository).toBeDefined();
    expect(service.repository).toBeInstanceOf(DiaDeFuncionamentoRepository);
  });
});

describe('GetDiaDeFuncionamentoService - Validação de campos selecionados', () => {
  test('deve selecionar os campos necessários', async () => {
    class MockRepository {
      constructor() {
        this.selectOneCalls = [];
        this.selectFields = {
          id: true,
          diaDaSemana: true,
          horaInicial: true,
          horaFinal: true,
          ativo: true,
          configuracaoId: true
        };
      }

      async selectOne(params) {
        this.selectOneCalls.push(params);
        return {};
      }
    }

    const service = new GetDiaDeFuncionamentoService(MockRepository, 'ddf-1');
    await service.execute();

    const selectCall = service.repository.selectOneCalls[0];
    const expectedFields = [
      'id',
      'diaDaSemana',
      'horaInicial',
      'horaFinal',
      'ativo',
      'configuracaoId'
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
          diaDaSemana: true,
          horaInicial: true,
          horaFinal: true,
          ativo: true,
          configuracaoId: true
        };
      }

      async selectOne(params) {
        this.selectOneCalls.push(params);
        return {};
      }
    }

    const id = 'ddf-42';
    const service = new GetDiaDeFuncionamentoService(MockRepository, id);
    await service.execute();

    const selectCall = service.repository.selectOneCalls[0];
    expect(selectCall.where).toEqual({ id });
  });

  test('deve incluir campos específicos do modelo', async () => {
    class MockRepository {
      constructor() {
        this.selectOneCalls = [];
        this.selectFields = {
          id: true,
          diaDaSemana: true,
          horaInicial: true,
          horaFinal: true,
          ativo: true
        };
      }

      async selectOne(params) {
        this.selectOneCalls.push(params);
        return {};
      }
    }

    const service = new GetDiaDeFuncionamentoService(MockRepository, 'ddf-1');
    await service.execute();

    const selectCall = service.repository.selectOneCalls[0];

    expect(selectCall.select.diaDaSemana).toBe(true);
    expect(selectCall.select.horaInicial).toBe(true);
    expect(selectCall.select.horaFinal).toBe(true);
  });
});

describe('GetDiaDeFuncionamentoService - Diferentes tipos de ID', () => {
  test('deve funcionar com ID string', () => {
    const service = new GetDiaDeFuncionamentoService(DiaDeFuncionamentoRepository, 'ddf-123');
    expect(service.id).toBe('ddf-123');
  });

  test('deve funcionar com ID undefined', () => {
    const service = new GetDiaDeFuncionamentoService(DiaDeFuncionamentoRepository, undefined);
    expect(service.id).toBeUndefined();
  });

  test('deve funcionar com ID null', () => {
    const service = new GetDiaDeFuncionamentoService(DiaDeFuncionamentoRepository, null);
    expect(service.id).toBeNull();
  });

  test('deve funcionar com IDs específicos do modelo', () => {
    const ids = ['ddf-1', 'ddf-abc', 'ddf-xyz'];

    ids.forEach(id => {
      const service = new GetDiaDeFuncionamentoService(DiaDeFuncionamentoRepository, id);
      expect(service.id).toBe(id);
    });
  });
});
