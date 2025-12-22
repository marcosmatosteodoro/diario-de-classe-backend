import AbstractController from '../../../src/controllers/abstractController.js';

describe('AbstractController', () => {
  test('deve ser uma classe', () => {
    expect(typeof AbstractController).toBe('function');
    expect(AbstractController.prototype.constructor).toBe(AbstractController);
  });

  test('não deve permitir instanciação direta', () => {
    const mockReq = {};
    const mockRes = {};

    expect(() => {
      return new AbstractController(mockReq, mockRes);
    }).toThrow('AbstractController não pode ser instanciada diretamente');
  });

  test('deve exigir req e res no construtor', () => {
    class TestController extends AbstractController {}

    expect(() => {
      return new TestController();
    }).toThrow('Parâmetros req e res são obrigatórios');
  });

  test('deve permitir herança', () => {
    class TestController extends AbstractController {
      async execute() {
        return 'test';
      }

      static async handle(req, res) {
        const controller = new TestController(req, res);
        return await controller.execute();
      }
    }

    const mockReq = {};
    const mockRes = {};
    const controller = new TestController(mockReq, mockRes);

    expect(controller).toBeInstanceOf(AbstractController);
    expect(controller).toBeInstanceOf(TestController);
    expect(controller.req).toBe(mockReq);
    expect(controller.res).toBe(mockRes);
  });

  test('deve ter método handleError', () => {
    class TestController extends AbstractController {
      async execute() {
        return 'test';
      }

      static async handle(req, res) {
        const controller = new TestController(req, res);
        return await controller.execute();
      }
    }

    let statusCalled = false;
    let jsonCalled = false;
    let statusCode = 0;
    let responseData = null;

    const mockReq = {};
    const mockRes = {
      status: function (code) {
        statusCalled = true;
        statusCode = code;
        return this;
      },
      json: function (data) {
        jsonCalled = true;
        responseData = data;
        return this;
      }
    };

    const controller = new TestController(mockReq, mockRes);

    expect(typeof controller.handleError).toBe('function');

    const error = new Error('Test error');
    controller.handleError(error);

    expect(statusCalled).toBe(true);
    expect(statusCode).toBe(500);
    expect(jsonCalled).toBe(true);
    expect(responseData).toEqual({
      message: 'Erro interno do servidor',
      error: 'Test error'
    });
  });

  test('métodos abstratos devem lançar erro', async () => {
    class TestController extends AbstractController {}

    const mockReq = {};
    const mockRes = {};
    const controller = new TestController(mockReq, mockRes);

    await expect(controller.execute()).rejects.toThrow(
      'Método execute() deve ser implementado na subclasse'
    );

    await expect(TestController.handle(mockReq, mockRes)).rejects.toThrow(
      'Método handle() deve ser implementado na subclasse'
    );
  });
});
