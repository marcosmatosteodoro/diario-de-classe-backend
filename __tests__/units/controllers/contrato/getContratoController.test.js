import { GetContratoController } from '../../../../src/controllers/contrato/getContratoController.js';
import { GetContratoService } from '../../../../src/services/contrato/getContratoService.js';
import { AbstractContratoController } from '../../../../src/controllers/contrato/AbstractContratoController.js';

describe('GetContratoController', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    // Mock básico do request
    mockReq = {
      params: {
        id: 'contrato123'
      },
      query: {},
      user: {
        id: '1',
        isAdmin: true
      },
      t: key => {
        const translations = {
          'contratos.get.not_found': 'Contrato não encontrado',
          'contratos.get.error': 'Erro ao buscar contrato'
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
      const controller = new GetContratoController(mockReq, mockRes);

      expect(controller).toBeInstanceOf(GetContratoController);
      expect(controller.req).toBe(mockReq);
      expect(controller.res).toBe(mockRes);
    });

    test('deve herdar de AbstractContratoController', () => {
      const controller = new GetContratoController(mockReq, mockRes);

      expect(controller).toBeInstanceOf(AbstractContratoController);
    });

    test('deve ter método execute implementado', () => {
      const controller = new GetContratoController(mockReq, mockRes);

      expect(controller.execute).toBeDefined();
      expect(typeof controller.execute).toBe('function');
    });

    test('deve ter método estático handle', () => {
      expect(GetContratoController.handle).toBeDefined();
      expect(typeof GetContratoController.handle).toBe('function');
    });
  });

  describe('Método execute()', () => {
    test('deve existir e ser uma função assíncrona', () => {
      const controller = new GetContratoController(mockReq, mockRes);

      expect(typeof controller.execute).toBe('function');
      expect(controller.execute.constructor.name).toBe('AsyncFunction');
    });

    test('deve usar validatedId quando disponível', async () => {
      const validatedId = 'validated123';
      mockReq.validatedId = validatedId;

      const mockContrato = {
        id: validatedId,
        idioma: 'inglês',
        status: 'ativo'
      };

      // Mock do GetContratoService.handle
      const originalHandle = GetContratoService.handle;
      GetContratoService.handle = async id => {
        expect(id).toBe(validatedId);
        return mockContrato;
      };

      const controller = new GetContratoController(mockReq, mockRes);
      await controller.execute();

      expect(mockRes.statusCode).toBe(200);

      // Restore original
      GetContratoService.handle = originalHandle;
    });

    test('deve usar params.id quando validatedId não está disponível', async () => {
      const paramsId = 'contrato123';
      mockReq.params.id = paramsId;
      delete mockReq.validatedId;

      const mockContrato = {
        id: paramsId,
        idioma: 'espanhol',
        status: 'ativo'
      };

      // Mock do GetContratoService.handle
      const originalHandle = GetContratoService.handle;
      GetContratoService.handle = async id => {
        expect(id).toBe(paramsId);
        return mockContrato;
      };

      const controller = new GetContratoController(mockReq, mockRes);
      await controller.execute();

      expect(mockRes.statusCode).toBe(200);

      // Restore original
      GetContratoService.handle = originalHandle;
    });

    test('deve retornar 200 com o contrato quando encontrado', async () => {
      const mockContrato = {
        id: 'contrato123',
        idAluno: '1',
        dataInicio: '2024-01-01',
        dataTermino: '2024-12-31',
        status: 'ativo',
        totalAulas: 40,
        idioma: 'inglês',
        aluno: {
          nome: 'João',
          nomeCompleto: 'João Silva'
        }
      };

      // Mock do GetContratoService.handle
      const originalHandle = GetContratoService.handle;
      GetContratoService.handle = async () => mockContrato;

      const controller = new GetContratoController(mockReq, mockRes);
      await controller.execute();

      expect(mockRes.statusCode).toBe(200);
      expect(mockRes.data).toEqual(mockContrato);

      // Restore original
      GetContratoService.handle = originalHandle;
    });

    test('deve retornar 404 quando contrato não for encontrado', async () => {
      // Mock do GetContratoService.handle para retornar null
      const originalHandle = GetContratoService.handle;
      GetContratoService.handle = async () => null;

      const controller = new GetContratoController(mockReq, mockRes);
      await controller.execute();

      expect(mockRes.statusCode).toBe(404);
      expect(mockRes.data).toEqual({
        message: 'Contrato não encontrado'
      });

      // Restore original
      GetContratoService.handle = originalHandle;
    });

    test('deve passar withRelations como true para o service', async () => {
      const mockContrato = {
        id: 'contrato123',
        idioma: 'francês',
        aluno: {
          nome: 'Maria',
          nomeCompleto: 'Maria Santos'
        },
        diaAulas: [],
        aulas: []
      };

      // Mock do GetContratoService.handle
      const originalHandle = GetContratoService.handle;
      GetContratoService.handle = async (id, params) => {
        expect(params.withRelations).toBe(true);
        return mockContrato;
      };

      const controller = new GetContratoController(mockReq, mockRes);
      await controller.execute();

      expect(mockRes.statusCode).toBe(200);

      // Restore original
      GetContratoService.handle = originalHandle;
    });

    test('deve passar additionalWhere do controller para o service', async () => {
      mockReq.user.isAdmin = false;
      mockReq.user.id = 'user123';

      const mockContrato = {
        id: 'contrato123',
        idioma: 'alemão'
      };

      // Mock do GetContratoService.handle
      const originalHandle = GetContratoService.handle;
      GetContratoService.handle = async (id, params) => {
        expect(params.additionalWhere).toBeDefined();
        return mockContrato;
      };

      const controller = new GetContratoController(mockReq, mockRes);
      await controller.execute();

      expect(mockRes.statusCode).toBe(200);

      // Restore original
      GetContratoService.handle = originalHandle;
    });

    test('deve passar query params corretamente', async () => {
      mockReq.query = {
        include: 'aulas',
        expand: 'aluno'
      };

      const mockContrato = {
        id: 'contrato123',
        idioma: 'italiano'
      };

      // Mock do GetContratoService.handle
      const originalHandle = GetContratoService.handle;
      GetContratoService.handle = async (id, params) => {
        expect(params).toBeDefined();
        expect(params.withRelations).toBe(true);
        expect(params.additionalWhere).toBeDefined();
        return mockContrato;
      };

      const controller = new GetContratoController(mockReq, mockRes);
      await controller.execute();

      expect(mockRes.statusCode).toBe(200);

      // Restore original
      GetContratoService.handle = originalHandle;
    });

    test('deve tratar erro e chamar handleError', async () => {
      const mockError = new Error('Database error');

      // Mock do GetContratoService.handle para lançar erro
      const originalHandle = GetContratoService.handle;
      GetContratoService.handle = async () => {
        throw mockError;
      };

      const controller = new GetContratoController(mockReq, mockRes);
      await controller.execute();

      expect(mockRes.statusCode).toBe(500);
      expect(mockRes.data).toEqual({
        message: 'Erro ao buscar contrato',
        error: 'Database error'
      });

      // Restore original
      GetContratoService.handle = originalHandle;
    });
  });

  describe('Método handle() estático', () => {
    test('deve executar o controller corretamente', async () => {
      const mockContrato = {
        id: 'contrato123',
        idioma: 'português'
      };

      // Mock do GetContratoService.handle
      const originalHandle = GetContratoService.handle;
      GetContratoService.handle = async () => mockContrato;

      await GetContratoController.handle(mockReq, mockRes);

      expect(mockRes.statusCode).toBe(200);
      expect(mockRes.data).toEqual(mockContrato);

      // Restore original
      GetContratoService.handle = originalHandle;
    });

    test('deve criar nova instância do controller e executar', async () => {
      const mockContrato = {
        id: 'contrato456',
        idioma: 'japonês'
      };

      // Mock do GetContratoService.handle
      const originalHandle = GetContratoService.handle;
      GetContratoService.handle = async () => mockContrato;

      await GetContratoController.handle(mockReq, mockRes);

      expect(mockRes.statusCode).toBe(200);
      expect(mockRes.data).toEqual(mockContrato);

      // Restore original
      GetContratoService.handle = originalHandle;
    });

    test('deve tratar erro no método estático', async () => {
      const mockError = new Error('Service error');

      // Mock do GetContratoService.handle para lançar erro
      const originalHandle = GetContratoService.handle;
      GetContratoService.handle = async () => {
        throw mockError;
      };

      await GetContratoController.handle(mockReq, mockRes);

      expect(mockRes.statusCode).toBe(500);

      // Restore original
      GetContratoService.handle = originalHandle;
    });
  });
});
