import { GetAulaListController } from '../../../../src/controllers/aula/getAulaListController.js';
import AbstractController from '../../../../src/controllers/abstractController.js';

describe('GetAulaListController', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    // Mock básico do request com user
    mockReq = {
      query: {},
      user: {
        id: 'user-123',
        isAdmin: false
      },
      t: key => {
        const translations = {
          'aulas.list.error': 'Erro ao buscar aulas'
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
      const controller = new GetAulaListController(mockReq, mockRes);

      expect(controller).toBeInstanceOf(GetAulaListController);
      expect(controller.req).toBe(mockReq);
      expect(controller.res).toBe(mockRes);
    });

    test('deve herdar de AbstractController', () => {
      const controller = new GetAulaListController(mockReq, mockRes);

      expect(controller).toBeInstanceOf(AbstractController);
    });

    test('deve inicializar where com filtro de professor para não admin', () => {
      const controller = new GetAulaListController(mockReq, mockRes);

      expect(controller.where).toEqual({ idProfessor: 'user-123' });
    });

    test('deve inicializar where vazio para admin', () => {
      mockReq.user.isAdmin = true;
      const controller = new GetAulaListController(mockReq, mockRes);

      expect(controller.where).toEqual({});
    });

    test('deve ter método execute implementado', () => {
      const controller = new GetAulaListController(mockReq, mockRes);

      expect(controller.execute).toBeDefined();
      expect(typeof controller.execute).toBe('function');
    });

    test('deve ter método estático handle', () => {
      expect(GetAulaListController.handle).toBeDefined();
      expect(typeof GetAulaListController.handle).toBe('function');
    });
  });

  describe('Estrutura da classe', () => {
    test('deve ter método bindMainWhere implementado', () => {
      const controller = new GetAulaListController(mockReq, mockRes);

      expect(typeof controller.bindMainWhere).toBe('function');
    });

    test('método handle deve ser uma função assíncrona', () => {
      expect(GetAulaListController.handle.constructor.name).toBe('AsyncFunction');
    });

    test('método handle deve aceitar req e res', () => {
      expect(GetAulaListController.handle.length).toBe(2);
    });
  });

  describe('bindMainWhere', () => {
    test('deve adicionar filtro de data quando dataInicio é fornecido', () => {
      mockReq.query.dataInicio = '2025-01-13';
      const controller = new GetAulaListController(mockReq, mockRes);

      controller.bindMainWhere();

      expect(controller.where.dataAula).toBeDefined();
      expect(controller.where.dataAula.gte).toEqual(new Date('2025-01-13T00:00:00.000Z'));
      expect(controller.where.dataAula.lte).toEqual(new Date('2025-01-13T23:59:59.999Z'));
    });

    test('deve usar dataInicio e dataTermino quando ambas são fornecidas', () => {
      mockReq.query.dataInicio = '2025-01-10';
      mockReq.query.dataTermino = '2025-01-15';
      const controller = new GetAulaListController(mockReq, mockRes);

      controller.bindMainWhere();

      expect(controller.where.dataAula.gte).toEqual(new Date('2025-01-10T00:00:00.000Z'));
      expect(controller.where.dataAula.lte).toEqual(new Date('2025-01-15T23:59:59.999Z'));
    });

    test('não deve adicionar filtro de data quando dataInicio não é fornecido', () => {
      const controller = new GetAulaListController(mockReq, mockRes);

      controller.bindMainWhere();

      expect(controller.where.dataAula).toBeUndefined();
    });
  });

  describe('execute', () => {
    test('deve ter método execute implementado', () => {
      const controller = new GetAulaListController(mockReq, mockRes);

      expect(controller.execute).toBeDefined();
      expect(typeof controller.execute).toBe('function');
    });
  });

  describe('handle - Método estático', () => {
    test('deve ser uma função estática', () => {
      expect(typeof GetAulaListController.handle).toBe('function');
      expect(GetAulaListController.handle).not.toBe(AbstractController.handle);
    });

    test('deve ser uma função assíncrona', () => {
      expect(GetAulaListController.handle.constructor.name).toBe('AsyncFunction');
    });

    test('deve aceitar parâmetros req e res', () => {
      expect(GetAulaListController.handle.length).toBe(2);
    });
  });
});
