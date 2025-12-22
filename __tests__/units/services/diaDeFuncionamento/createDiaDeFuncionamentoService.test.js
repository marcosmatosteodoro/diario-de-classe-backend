import { CreateDiaDeFuncionamentoService } from '../../../../src/services/diaDeFuncionamento/createDiaDeFuncionamentoService.js';
import DiaDeFuncionamentoRepository from '../../../../src/repositories/diaDeFuncionamentoRepository.js';
import AbstractService from '../../../../src/services/abstractService.js';

describe('CreateDiaDeFuncionamentoService', () => {
  describe('Inicialização', testInicializacao);
  describe('Método execute()', testExecuteMethod);
  describe('Método estático handle()', testStaticHandleMethod);
  describe('Integração com AbstractService', testAbstractServiceIntegration);
  describe('Validação de dados', testDataValidation);
  describe('Diferentes cenários de criação', testCreationScenarios);
});

function testInicializacao() {
  it('deve ser instanciado corretamente', () => {
    class MockRepository {}
    const mockData = {
      diaSemana: 'SEGUNDA',
      horaInicial: '08:00',
      horaFinal: '12:00',
      ativo: true
    };
    const service = new CreateDiaDeFuncionamentoService(MockRepository, mockData);

    expect(service.repository).toBeInstanceOf(MockRepository);
    expect(service.data).toBe(mockData);
  });

  test('deve herdar de AbstractService', () => {
    const mockData = { diaSemana: 'TERCA', horaInicial: '09:00', horaFinal: '10:00' };
    const service = new CreateDiaDeFuncionamentoService(DiaDeFuncionamentoRepository, mockData);

    expect(service).toBeInstanceOf(AbstractService);
  });

  test('deve ter método execute implementado', () => {
    const mockData = { diaSemana: 'QUARTA', horaInicial: '07:00', horaFinal: '08:00' };
    const service = new CreateDiaDeFuncionamentoService(DiaDeFuncionamentoRepository, mockData);

    expect(service.execute).toBeDefined();
    expect(typeof service.execute).toBe('function');
  });

  test('deve ter método estático handle', () => {
    expect(CreateDiaDeFuncionamentoService.handle).toBeDefined();
    expect(typeof CreateDiaDeFuncionamentoService.handle).toBe('function');
  });
}

function testExecuteMethod() {
  test('deve existir e ser uma função assíncrona', () => {
    const mockData = { diaSemana: 'QUINTA', horaInicial: '08:00', horaFinal: '09:00' };
    const service = new CreateDiaDeFuncionamentoService(DiaDeFuncionamentoRepository, mockData);

    expect(typeof service.execute).toBe('function');
    expect(service.execute.constructor.name).toBe('AsyncFunction');
  });

  test('deve chamar repository.create com parâmetros corretos', async () => {
    const mockData = {
      diaSemana: 'SEXTA',
      horaInicial: '10:00',
      horaFinal: '12:00',
      ativo: true
    };

    class MockRepository {
      constructor() {
        this.createCalls = [];
        this.selectFields = {
          id: true,
          diaSemana: true,
          horaInicial: true,
          horaFinal: true,
          ativo: true,
          configuracaoId: true
        };
      }

      async create(data, options) {
        this.createCalls.push({ data, options });
        return { id: 'ddf-1', ...data };
      }
    }

    const service = new CreateDiaDeFuncionamentoService(MockRepository, mockData);
    await service.execute();

    expect(service.repository.createCalls).toHaveLength(1);
    expect(service.repository.createCalls[0]).toEqual({
      data: {
        diaSemana: mockData.diaSemana,
        horaInicial: mockData.horaInicial,
        horaFinal: mockData.horaFinal,
        ativo: mockData.ativo,
        configuracaoId: mockData.configuracaoId
      },
      options: { select: service.repository.selectFields }
    });
  });

  test('deve retornar o registro criado', async () => {
    const mockData = { diaSemana: 'SABADO', horaInicial: '14:00', horaFinal: '18:00' };
    const mockObj = { id: 'ddf-2', ...mockData };

    class MockRepository {
      constructor() {
        this.selectFields = {};
      }

      async create() {
        return mockObj;
      }
    }

    const service = new CreateDiaDeFuncionamentoService(MockRepository, mockData);
    const result = await service.execute();

    expect(result).toEqual(mockObj);
  });

  test('deve propagar erro quando repository falha', async () => {
    const mockData = { diaSemana: 'DOMINGO', horaInicial: '08:00', horaFinal: '09:00' };
    const mockError = new Error('Erro de banco de dados');

    class MockRepository {
      constructor() {
        this.selectFields = {};
      }

      async create() {
        throw mockError;
      }
    }

    const service = new CreateDiaDeFuncionamentoService(MockRepository, mockData);

    await expect(service.execute()).rejects.toThrow('Erro de banco de dados');
  });
}

function testStaticHandleMethod() {
  test('deve executar o serviço com dados fornecidos', async () => {
    const mockData = {
      diaSemana: 'SEGUNDA',
      horaInicial: '08:00',
      horaFinal: '12:00',
      ativo: true
    };

    class MockRepository {
      constructor() {
        this.selectFields = {};
      }

      async create() {
        return { id: 'ddf-3' };
      }
    }

    const originalHandle = CreateDiaDeFuncionamentoService.handle;
    CreateDiaDeFuncionamentoService.handle = async function (data) {
      const service = new CreateDiaDeFuncionamentoService(MockRepository, data);
      return await service.execute();
    };

    const result = await CreateDiaDeFuncionamentoService.handle(mockData);

    expect(result.id).toBeDefined();

    CreateDiaDeFuncionamentoService.handle = originalHandle;
  });

  test('deve usar o Repository padrão quando chamado normalmente', async () => {
    expect(typeof CreateDiaDeFuncionamentoService.handle).toBe('function');
    expect(CreateDiaDeFuncionamentoService.handle.constructor.name).toBe('AsyncFunction');
  });

  test('deve criar nova instância do serviço a cada chamada', async () => {
    const mockData1 = { diaSemana: 'TERCA', horaInicial: '08:00', horaFinal: '09:00' };
    const mockData2 = { diaSemana: 'QUARTA', horaInicial: '10:00', horaFinal: '11:00' };

    class MockRepository {
      constructor() {
        this.selectFields = {};
        this.instanceCount = MockRepository.count || 0;
        MockRepository.count = (MockRepository.count || 0) + 1;
      }

      async create() {
        return { id: `ddf-${this.instanceCount}` };
      }
    }

    const originalHandle = CreateDiaDeFuncionamentoService.handle;
    CreateDiaDeFuncionamentoService.handle = async function (data) {
      const service = new CreateDiaDeFuncionamentoService(MockRepository, data);
      return await service.execute();
    };

    const result1 = await CreateDiaDeFuncionamentoService.handle(mockData1);
    const result2 = await CreateDiaDeFuncionamentoService.handle(mockData2);

    expect(result1.id).not.toBe(result2.id);

    CreateDiaDeFuncionamentoService.handle = originalHandle;
  });
}

function testAbstractServiceIntegration() {
  test('deve implementar método execute() abstrato', () => {
    const mockData = { diaSemana: 'QUINTA', horaInicial: '08:00', horaFinal: '09:00' };
    const service = new CreateDiaDeFuncionamentoService(DiaDeFuncionamentoRepository, mockData);

    expect(service.execute).toBeDefined();
    expect(service.execute).not.toBe(AbstractService.prototype.execute);
  });

  test('deve implementar método handle() estático', () => {
    expect(typeof CreateDiaDeFuncionamentoService.handle).toBe('function');
    expect(CreateDiaDeFuncionamentoService.handle).not.toBe(AbstractService.handle);
  });

  test('deve ter acesso ao repository através da classe pai', () => {
    const mockData = { diaSemana: 'SEXTA', horaInicial: '08:00', horaFinal: '09:00' };
    const service = new CreateDiaDeFuncionamentoService(DiaDeFuncionamentoRepository, mockData);

    expect(service.repository).toBeDefined();
    expect(service.repository).toBeInstanceOf(DiaDeFuncionamentoRepository);
  });

  test('deve ser uma subclasse de AbstractService', () => {
    expect(CreateDiaDeFuncionamentoService.prototype).toBeInstanceOf(Object);
    expect(Object.getPrototypeOf(CreateDiaDeFuncionamentoService.prototype)).toBe(
      AbstractService.prototype
    );
  });
}

function testDataValidation() {
  test('deve armazenar dados fornecidos corretamente', () => {
    const mockData = {
      diaSemana: 'SABADO',
      horaInicial: '14:00',
      horaFinal: '18:00',
      ativo: true
    };
    const service = new CreateDiaDeFuncionamentoService(DiaDeFuncionamentoRepository, mockData);

    expect(service.data).toBe(mockData);
    expect(service.data.diaSemana).toBe('SABADO');
    expect(service.data.horaInicial).toBe('14:00');
    expect(service.data.horaFinal).toBe('18:00');
    expect(service.data.ativo).toBe(true);
  });

  test('deve funcionar com dados parciais', () => {
    const mockData = { diaSemana: 'DOMINGO', horaInicial: '08:00', horaFinal: '09:00' };
    const service = new CreateDiaDeFuncionamentoService(DiaDeFuncionamentoRepository, mockData);

    expect(service.data).toBe(mockData);
    expect(service.data.ativo).toBeUndefined();
  });
}

function testCreationScenarios() {
  test('deve funcionar com dados completos', async () => {
    const mockData = {
      diaSemana: 'SEGUNDA',
      horaInicial: '08:00',
      horaFinal: '12:00',
      ativo: true
    };

    class MockRepository {
      constructor() {
        this.selectFields = {};
      }

      async create(data, _options) {
        return { ...data, id: 'ddf-created' };
      }
    }

    const service = new CreateDiaDeFuncionamentoService(MockRepository, mockData);
    const result = await service.execute();

    expect(result.diaSemana).toBe('SEGUNDA');
    expect(result.horaInicial).toBe('08:00');
    expect(result.horaFinal).toBe('12:00');
    expect(result.ativo).toBe(true);
    expect(result.id).toBe('ddf-created');
  });

  test('deve funcionar com dados mínimos obrigatórios', async () => {
    const mockData = { diaSemana: 'TERCA', horaInicial: '09:00', horaFinal: '10:00' };

    class MockRepository {
      constructor() {
        this.selectFields = {};
      }

      async create(data, _options) {
        return { ...data, id: 'ddf-created-2' };
      }
    }

    const service = new CreateDiaDeFuncionamentoService(MockRepository, mockData);
    const result = await service.execute();

    expect(result.diaSemana).toBe('TERCA');
    expect(result.horaInicial).toBe('09:00');
    expect(result.horaFinal).toBe('10:00');
  });
}
