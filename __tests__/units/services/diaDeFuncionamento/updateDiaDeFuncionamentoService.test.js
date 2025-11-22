import { UpdateDiaDeFuncionamentoService } from '../../../../src/services/diaDeFuncionamento/updateDiaDeFuncionamentoService.js';
import DiaDeFuncionamentoRepository from '../../../../src/repositories/diaDeFuncionamentoRepository.js';
import AbstractService from '../../../../src/services/abstractService.js';

function describeInitialization() {
  describe('Inicialização', () => {
    test('deve criar uma instância válida', () => {
      const mockData = {
        diaSemana: 'MONDAY',
        horaInicial: '08:00',
        horaFinal: '12:00',
        ativo: true
      };
      const service = new UpdateDiaDeFuncionamentoService(
        DiaDeFuncionamentoRepository,
        'df-id-1',
        mockData
      );

      expect(service).toBeInstanceOf(UpdateDiaDeFuncionamentoService);
      expect(service).toBeInstanceOf(AbstractService);
      expect(service.repository).toBeInstanceOf(DiaDeFuncionamentoRepository);
      expect(service.id).toBe('df-id-1');
      expect(service.data).toBe(mockData);
    });

    test('deve herdar de AbstractService', () => {
      const mockData = { diaSemana: 'MONDAY' };
      const service = new UpdateDiaDeFuncionamentoService(
        DiaDeFuncionamentoRepository,
        'df-id-1',
        mockData
      );

      expect(service).toBeInstanceOf(AbstractService);
    });

    test('deve ter método execute implementado', () => {
      const mockData = { diaSemana: 'MONDAY' };
      const service = new UpdateDiaDeFuncionamentoService(
        DiaDeFuncionamentoRepository,
        'df-id-1',
        mockData
      );

      expect(service.execute).toBeDefined();
      expect(typeof service.execute).toBe('function');
    });

    test('deve ter método estático handle', () => {
      expect(UpdateDiaDeFuncionamentoService.handle).toBeDefined();
      expect(typeof UpdateDiaDeFuncionamentoService.handle).toBe('function');
    });
  });
}

function describeExecuteMethod() {
  describe('Método execute()', () => {
    test('deve existir e ser uma função assíncrona', () => {
      const mockData = { diaSemana: 'MONDAY' };
      const service = new UpdateDiaDeFuncionamentoService(
        DiaDeFuncionamentoRepository,
        'df-id-1',
        mockData
      );

      expect(typeof service.execute).toBe('function');
      expect(service.execute.constructor.name).toBe('AsyncFunction');
    });

    test('deve chamar repository.update com parâmetros corretos', async () => {
      const mockData = {
        diaSemana: 'MONDAY',
        horaInicial: '08:00',
        horaFinal: '12:00',
        ativo: true
      };

      class MockRepository {
        constructor() {
          this.updateCalls = [];
          this.selectFields = {
            id: true,
            diaSemana: true,
            horaInicial: true,
            horaFinal: true,
            ativo: true,
            configuracaoId: true
          };
        }

        async update(where, data, options) {
          this.updateCalls.push({ where, data, options });
          return { id: where.id, ...data };
        }
      }

      const service = new UpdateDiaDeFuncionamentoService(MockRepository, 'df-id-1', mockData);
      await service.execute();

      expect(service.repository.updateCalls).toHaveLength(1);
      expect(service.repository.updateCalls[0]).toEqual({
        where: { id: 'df-id-1' },
        data: mockData,
        options: { select: service.repository.selectFields }
      });
    });

    test('deve retornar o registro atualizado', async () => {
      const mockData = { horaInicial: '09:00' };

      const mockRecord = {
        id: 1,
        diaSemana: 'MONDAY',
        horaInicial: '09:00',
        horaFinal: '12:00',
        ativo: true
      };

      class MockRepository {
        constructor() {
          this.selectFields = {
            id: true,
            diaSemana: true,
            horaInicial: true,
            horaFinal: true,
            ativo: true,
            configuracaoId: true
          };
        }

        async update() {
          return mockRecord;
        }
      }

      const service = new UpdateDiaDeFuncionamentoService(MockRepository, 'df-id-1', mockData);
      const result = await service.execute();

      expect(result).toEqual(mockRecord);
    });

    test('deve propagar erro quando repository falha', async () => {
      const mockData = { horaInicial: '09:00' };
      const mockError = new Error('Erro de banco de dados');

      class MockRepository {
        constructor() {
          this.selectFields = {
            id: true,
            diaSemana: true,
            horaInicial: true,
            horaFinal: true,
            ativo: true,
            configuracaoId: true
          };
        }

        async update() {
          throw mockError;
        }
      }

      const service = new UpdateDiaDeFuncionamentoService(MockRepository, 'df-id-1', mockData);

      await expect(service.execute()).rejects.toThrow('Erro de banco de dados');
    });

    test('deve usar where clause com id correto', async () => {
      const mockData = { horaInicial: '09:00' };

      class MockRepository {
        constructor() {
          this.updateCalls = [];
          this.selectFields = {
            id: true,
            diaSemana: true,
            horaInicial: true,
            horaFinal: true,
            ativo: true,
            configuracaoId: true
          };
        }

        async update(where, data, options) {
          this.updateCalls.push({ where, data, options });
          return {};
        }
      }

      const service = new UpdateDiaDeFuncionamentoService(MockRepository, 123, mockData);
      await service.execute();

      expect(service.repository.updateCalls[0].where).toEqual({ id: 123 });
    });
  });
}

function describeStaticHandleMethod() {
  describe('Método estático handle()', () => {
    test('deve executar update via método estático (apenas existência)', async () => {
      // Não vamos invocar o repositório real neste teste unitário para evitar dependências
      // apenas asseguramos que o método existe e é async
      expect(typeof UpdateDiaDeFuncionamentoService.handle).toBe('function');
      expect(UpdateDiaDeFuncionamentoService.handle.constructor.name).toBe('AsyncFunction');
    });

    test('deve criar nova instância do serviço a cada chamada (existence)', async () => {
      expect(UpdateDiaDeFuncionamentoService.handle).toBeDefined();
      expect(UpdateDiaDeFuncionamentoService.handle.constructor.name).toBe('AsyncFunction');
    });
  });
}

function describeAbstractServiceIntegration() {
  describe('Integração com AbstractService', () => {
    test('deve implementar método execute() abstrato', () => {
      const mockData = { horaInicial: '09:00' };
      const service = new UpdateDiaDeFuncionamentoService(
        DiaDeFuncionamentoRepository,
        'df-id-1',
        mockData
      );

      expect(service.execute).toBeDefined();
      expect(service.execute).not.toBe(AbstractService.prototype.execute);
    });

    test('deve implementar método handle() estático', () => {
      expect(typeof UpdateDiaDeFuncionamentoService.handle).toBe('function');
      expect(UpdateDiaDeFuncionamentoService.handle).not.toBe(AbstractService.handle);
    });

    test('deve ter acesso ao repository através da classe pai', () => {
      const mockData = { horaInicial: '09:00' };
      const service = new UpdateDiaDeFuncionamentoService(
        DiaDeFuncionamentoRepository,
        'df-id-1',
        mockData
      );

      expect(service.repository).toBeDefined();
      expect(service.repository).toBeInstanceOf(DiaDeFuncionamentoRepository);
    });

    test('deve ser uma subclasse de AbstractService', () => {
      expect(UpdateDiaDeFuncionamentoService.prototype).toBeInstanceOf(Object);
      expect(Object.getPrototypeOf(UpdateDiaDeFuncionamentoService.prototype)).toBe(
        AbstractService.prototype
      );
    });
  });
}

function describeParameterValidation() {
  describe('Validação de parâmetros', () => {
    test('deve armazenar id e dados fornecidos corretamente', () => {
      const mockData = {
        diaSemana: 'MONDAY',
        horaInicial: '08:00',
        horaFinal: '12:00',
        ativo: false
      };

      const service = new UpdateDiaDeFuncionamentoService(
        DiaDeFuncionamentoRepository,
        123,
        mockData
      );

      expect(service.id).toBe(123);
      expect(service.data).toBe(mockData);
      expect(service.data.diaSemana).toBe('MONDAY');
    });

    test('deve funcionar com diferentes tipos de ID', () => {
      const mockData = { horaInicial: '08:00' };
      const testCases = [1, '123', 'abc'];

      testCases.forEach(testId => {
        const service = new UpdateDiaDeFuncionamentoService(
          DiaDeFuncionamentoRepository,
          testId,
          mockData
        );
        expect(service.id).toBe(testId);
      });
    });

    test('deve funcionar com dados parciais', () => {
      const mockData = { horaInicial: '08:00' };

      const service = new UpdateDiaDeFuncionamentoService(
        DiaDeFuncionamentoRepository,
        'df-id-1',
        mockData
      );

      expect(service.data).toBe(mockData);
      expect(service.data.horaFinal).toBeUndefined();
    });
  });
}

function describeUpdateScenarios() {
  describe('Diferentes cenários de atualização', () => {
    test('deve funcionar com dados completos', async () => {
      const mockData = {
        diaSemana: 'MONDAY',
        horaInicial: '08:00',
        horaFinal: '12:00',
        ativo: true
      };

      class MockRepository {
        constructor() {
          this.selectFields = {
            id: true,
            diaSemana: true,
            horaInicial: true,
            horaFinal: true,
            ativo: true,
            configuracaoId: true
          };
        }

        async update(where, data, _options) {
          return { ...data, id: where.id, dataAtualizacao: '2024-01-01' };
        }
      }

      const service = new UpdateDiaDeFuncionamentoService(MockRepository, 'df-id-1', mockData);
      const result = await service.execute();

      expect(result.diaSemana).toBe('MONDAY');
      expect(result.horaInicial).toBe('08:00');
      expect(result.id).toBe('df-id-1');
    });

    test('deve funcionar com atualização parcial', async () => {
      const mockData = { horaInicial: '09:00' };

      class MockRepository {
        constructor() {
          this.selectFields = {
            id: true,
            diaSemana: true,
            horaInicial: true,
            horaFinal: true,
            ativo: true,
            configuracaoId: true
          };
        }

        async update(where, data, _options) {
          return { id: where.id, ...data };
        }
      }

      const service = new UpdateDiaDeFuncionamentoService(MockRepository, 'df-id-1', mockData);
      const result = await service.execute();

      expect(result.horaInicial).toBe('09:00');
      expect(result.id).toBe('df-id-1');
    });
  });
}

describe('UpdateDiaDeFuncionamentoService', () => {
  describeInitialization();
  describeExecuteMethod();
  describeStaticHandleMethod();
  describeAbstractServiceIntegration();
  describeParameterValidation();
  describeUpdateScenarios();
});
