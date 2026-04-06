import { GetContratoListController } from '../../../../src/controllers/contrato/getContratoListController.js';
import { GetContratoListService } from '../../../../src/services/contrato/getContratoListService.js';
import AbstractController from '../../../../src/controllers/abstractController.js';

describe('GetContratoListController', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    // Mock básico do request
    mockReq = {
      query: {},
      user: {
        id: '1',
        isAdmin: true
      },
      t: key => {
        const translations = {
          'contratos.list.error': 'Erro ao buscar contratos'
        };
        return translations[key] || key;
      }
    };

    // Mock básico do response
    mockRes = {
      status: function (code) {
        this.statusCode = code;
        return this;
      },
      json: function (data) {
        this.data = data;
        return this;
      },
      statusCode: null,
      data: null
    };
  });

  describe('Inicialização', () => {
    test('deve criar uma instância com req e res', () => {
      const controller = new GetContratoListController(mockReq, mockRes);

      expect(controller).toBeInstanceOf(GetContratoListController);
      expect(controller.req).toBe(mockReq);
      expect(controller.res).toBe(mockRes);
    });

    test('deve herdar de AbstractController', () => {
      const controller = new GetContratoListController(mockReq, mockRes);

      expect(controller).toBeInstanceOf(AbstractController);
    });

    test('deve inicializar where como objeto vazio', () => {
      const controller = new GetContratoListController(mockReq, mockRes);

      expect(controller.where).toEqual({});
      expect(typeof controller.where).toBe('object');
    });

    test('deve ter método execute implementado', () => {
      const controller = new GetContratoListController(mockReq, mockRes);

      expect(controller.execute).toBeDefined();
      expect(typeof controller.execute).toBe('function');
    });

    test('deve ter método estático handle', () => {
      expect(GetContratoListController.handle).toBeDefined();
      expect(typeof GetContratoListController.handle).toBe('function');
    });

    test('deve chamar bindMainWhere no construtor', () => {
      mockReq.query.idioma = 'inglês';
      const controller = new GetContratoListController(mockReq, mockRes);

      expect(controller.where.idioma).toBe('inglês');
    });
  });

  describe('Método bindMainWhere()', () => {
    test('deve configurar filtro dataInicio com gte quando dataInicio é fornecido', () => {
      mockReq.query.dataInicio = '2024-01-15';

      const controller = new GetContratoListController(mockReq, mockRes);

      expect(controller.where.dataInicio).toBeDefined();
      expect(controller.where.dataInicio.gte).toBeInstanceOf(Date);
      expect(controller.where.dataInicio.gte.toISOString()).toBe('2024-01-15T00:00:00.000Z');
    });

    test('deve configurar filtro dataTermino com lte quando dataTermino é fornecido', () => {
      mockReq.query.dataTermino = '2024-12-31';

      const controller = new GetContratoListController(mockReq, mockRes);

      expect(controller.where.dataTermino).toBeDefined();
      expect(controller.where.dataTermino.lte).toBeInstanceOf(Date);
      expect(controller.where.dataTermino.lte.toISOString()).toBe('2024-12-31T23:59:59.999Z');
    });

    test('deve configurar filtros independentes para dataInicio e dataTermino', () => {
      mockReq.query.dataInicio = '2024-01-01';
      mockReq.query.dataTermino = '2024-12-31';

      const controller = new GetContratoListController(mockReq, mockRes);

      expect(controller.where.dataInicio.gte.toISOString()).toBe('2024-01-01T00:00:00.000Z');
      expect(controller.where.dataTermino.lte.toISOString()).toBe('2024-12-31T23:59:59.999Z');
    });

    test('não deve configurar dataTermino quando apenas dataInicio é fornecido', () => {
      mockReq.query.dataInicio = '2024-01-15';

      const controller = new GetContratoListController(mockReq, mockRes);

      expect(controller.where.dataInicio).toBeDefined();
      expect(controller.where.dataTermino).toBeUndefined();
    });

    test('não deve configurar dataInicio quando apenas dataTermino é fornecido', () => {
      mockReq.query.dataTermino = '2024-12-31';

      const controller = new GetContratoListController(mockReq, mockRes);

      expect(controller.where.dataInicio).toBeUndefined();
      expect(controller.where.dataTermino).toBeDefined();
    });

    test('deve configurar filtro idioma quando fornecido', () => {
      mockReq.query.idioma = 'inglês';

      const controller = new GetContratoListController(mockReq, mockRes);

      expect(controller.where.idioma).toBe('inglês');
    });

    test('deve configurar filtro aluno com contains e mode insensitive', () => {
      mockReq.query.aluno = 'João';

      const controller = new GetContratoListController(mockReq, mockRes);

      expect(controller.where.aluno).toBeDefined();
      expect(controller.where.aluno.OR).toBeDefined();
      expect(controller.where.aluno.OR).toHaveLength(2);
      expect(controller.where.aluno.OR[0]).toEqual({
        nome: {
          contains: 'João',
          mode: 'insensitive'
        }
      });
      expect(controller.where.aluno.OR[1]).toEqual({
        nomeCompleto: {
          contains: 'João',
          mode: 'insensitive'
        }
      });
    });

    test('deve configurar filtro q com OR para busca em aluno.nome', () => {
      mockReq.query.q = 'Maria';

      const controller = new GetContratoListController(mockReq, mockRes);

      expect(controller.where.OR).toBeDefined();
      expect(controller.where.OR).toHaveLength(1);
      expect(controller.where.OR[0].aluno.nome.contains).toBe('Maria');
      expect(controller.where.OR[0].aluno.nome.mode).toBe('insensitive');
    });

    test('deve configurar múltiplos filtros simultaneamente', () => {
      mockReq.query = {
        dataInicio: '2024-01-01',
        dataTermino: '2024-12-31',
        idioma: 'espanhol',
        aluno: 'Pedro'
      };

      const controller = new GetContratoListController(mockReq, mockRes);

      expect(controller.where.dataInicio.gte.toISOString()).toBe('2024-01-01T00:00:00.000Z');
      expect(controller.where.dataTermino.lte.toISOString()).toBe('2024-12-31T23:59:59.999Z');
      expect(controller.where.idioma).toBe('espanhol');
      expect(controller.where.aluno.OR).toBeDefined();
      expect(controller.where.aluno.OR[0].nome.contains).toBe('Pedro');
      expect(controller.where.aluno.OR[1].nomeCompleto.contains).toBe('Pedro');
    });

    test('deve manter where vazio quando nenhum parâmetro é fornecido', () => {
      mockReq.query = {};

      const controller = new GetContratoListController(mockReq, mockRes);

      expect(controller.where).toEqual({});
    });

    test('deve ignorar parâmetros não definidos', () => {
      mockReq.query = {
        dataInicio: '2024-01-01',
        idioma: undefined,
        aluno: null
      };

      const controller = new GetContratoListController(mockReq, mockRes);

      expect(controller.where.dataInicio).toBeDefined();
      expect(controller.where.idioma).toBeUndefined();
      expect(controller.where.aluno).toBeUndefined();
    });
  });

  describe('Método execute()', () => {
    test('deve existir e ser uma função assíncrona', () => {
      const controller = new GetContratoListController(mockReq, mockRes);

      expect(typeof controller.execute).toBe('function');
      expect(controller.execute.constructor.name).toBe('AsyncFunction');
    });

    test('deve retornar 204 quando não houver contratos', async () => {
      // Mock do GetContratoListService.handle para retornar array vazio
      const originalHandle = GetContratoListService.handle;
      GetContratoListService.handle = async () => [];

      const controller = new GetContratoListController(mockReq, mockRes);
      await controller.execute();

      expect(mockRes.statusCode).toBe(204);

      // Restore original
      GetContratoListService.handle = originalHandle;
    });

    test('deve retornar 204 quando contratos for null', async () => {
      // Mock do GetContratoListService.handle para retornar null
      const originalHandle = GetContratoListService.handle;
      GetContratoListService.handle = async () => null;

      const controller = new GetContratoListController(mockReq, mockRes);
      await controller.execute();

      expect(mockRes.statusCode).toBe(204);

      // Restore original
      GetContratoListService.handle = originalHandle;
    });

    test('deve retornar 200 com count e data quando encontrar contratos', async () => {
      const mockContratos = [
        { id: 'contrato1', idioma: 'inglês' },
        { id: 'contrato2', idioma: 'espanhol' }
      ];

      // Mock do GetContratoListService.handle
      const originalHandle = GetContratoListService.handle;
      GetContratoListService.handle = async () => mockContratos;

      const controller = new GetContratoListController(mockReq, mockRes);
      await controller.execute();

      expect(mockRes.statusCode).toBe(200);
      expect(mockRes.data).toEqual({
        count: 2,
        data: mockContratos
      });

      // Restore original
      GetContratoListService.handle = originalHandle;
    });

    test('deve passar where corretamente para o service', async () => {
      mockReq.query = {
        dataInicio: '2024-01-01',
        idioma: 'francês'
      };

      // Mock do GetContratoListService.handle
      const originalHandle = GetContratoListService.handle;
      GetContratoListService.handle = async where => {
        expect(where.dataInicio).toBeDefined();
        expect(where.idioma).toBe('francês');
        return [{ id: 'contrato1' }];
      };

      const controller = new GetContratoListController(mockReq, mockRes);
      await controller.execute();

      expect(mockRes.statusCode).toBe(200);

      // Restore original
      GetContratoListService.handle = originalHandle;
    });

    test('deve tratar erro e chamar handleError', async () => {
      const mockError = new Error('Database error');

      // Mock do GetContratoListService.handle para lançar erro
      const originalHandle = GetContratoListService.handle;
      GetContratoListService.handle = async () => {
        throw mockError;
      };

      const controller = new GetContratoListController(mockReq, mockRes);

      // Mock do handleError que rastreia chamadas
      let handleErrorCalled = false;
      let handleErrorArgs = null;
      const originalHandleError = controller.handleError;
      controller.handleError = function (error, message) {
        handleErrorCalled = true;
        handleErrorArgs = [error, message];
        return originalHandleError.call(this, error, message);
      };

      await controller.execute();

      expect(handleErrorCalled).toBe(true);
      expect(handleErrorArgs[0]).toBe(mockError);
      expect(handleErrorArgs[1]).toBe('contratos.list.error');

      // Restore original
      GetContratoListService.handle = originalHandle;
    });
  });

  describe('Método estático handle()', () => {
    test('deve criar instância e executar', async () => {
      const mockContratos = [{ id: 'contrato1' }];

      // Mock do GetContratoListService.handle
      const originalHandle = GetContratoListService.handle;
      GetContratoListService.handle = async () => mockContratos;

      await GetContratoListController.handle(mockReq, mockRes);

      expect(mockRes.statusCode).toBe(200);
      expect(mockRes.data.count).toBe(1);
      expect(mockRes.data.data).toEqual(mockContratos);

      // Restore original
      GetContratoListService.handle = originalHandle;
    });

    test('deve funcionar com diferentes query parameters', async () => {
      mockReq.query = {
        dataInicio: '2024-06-01',
        dataTermino: '2024-06-30',
        idioma: 'alemão'
      };

      const mockContratos = [
        { id: 'contrato1', idioma: 'alemão' },
        { id: 'contrato2', idioma: 'alemão' }
      ];

      // Mock do GetContratoListService.handle
      const originalHandle = GetContratoListService.handle;
      GetContratoListService.handle = async where => {
        expect(where.idioma).toBe('alemão');
        expect(where.dataInicio.gte).toBeInstanceOf(Date);
        expect(where.dataTermino.lte).toBeInstanceOf(Date);
        return mockContratos;
      };

      await GetContratoListController.handle(mockReq, mockRes);

      expect(mockRes.statusCode).toBe(200);
      expect(mockRes.data.count).toBe(2);

      // Restore original
      GetContratoListService.handle = originalHandle;
    });
  });

  describe('Estrutura da classe', () => {
    test('deve implementar os métodos obrigatórios', () => {
      const controller = new GetContratoListController(mockReq, mockRes);

      expect(typeof controller.execute).toBe('function');
      expect(typeof controller.bindMainWhere).toBe('function');
      expect(typeof GetContratoListController.handle).toBe('function');
    });

    test('deve armazenar req e res corretamente', () => {
      const controller = new GetContratoListController(mockReq, mockRes);

      expect(controller.req).toBe(mockReq);
      expect(controller.res).toBe(mockRes);
    });

    test('deve chamar super no construtor', () => {
      const controller = new GetContratoListController(mockReq, mockRes);

      // Verifica se inherited properties estão disponíveis
      expect(controller.handleError).toBeDefined();
    });
  });
});
