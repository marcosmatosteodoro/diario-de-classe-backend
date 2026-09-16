import AbstractController from '../../../src/controllers/abstractController.js';
import Constants from '../../../src/utilities/constants.js';

class TestController extends AbstractController {
  async execute() {
    return 'test';
  }

  static async handle(req, res) {
    const controller = new TestController(req, res);
    return await controller.execute();
  }
}

const buildMockRes = () => {
  const mockRes = {
    statusCode: null,
    data: null,
    status: function (code) {
      this.statusCode = code;
      return this;
    },
    json: function (data) {
      this.data = data;
      return this;
    }
  };
  return mockRes;
};

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
    // Ambiente de teste não é 'development': erro 500 não deve vazar error.message
    expect(responseData).toEqual({
      message: 'Erro interno do servidor'
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

  describe('handleError - vazamento de error.message', () => {
    const originalEnv = Constants.env;

    afterEach(() => {
      Constants.env = originalEnv;
    });

    test('status 500 fora de development não inclui error na resposta', () => {
      Constants.env = 'test';

      const mockReq = {};
      const mockRes = buildMockRes();
      const controller = new TestController(mockReq, mockRes);

      controller.handleError(new Error('Erro interno do Prisma'));

      expect(mockRes.statusCode).toBe(500);
      expect(mockRes.data).toEqual({ message: 'Erro interno do servidor' });
      expect(mockRes.data.error).toBeUndefined();
    });

    test('status 500 em development ainda inclui error na resposta', () => {
      Constants.env = 'development';

      const mockReq = {};
      const mockRes = buildMockRes();
      const controller = new TestController(mockReq, mockRes);

      controller.handleError(new Error('Erro interno do Prisma'));

      expect(mockRes.statusCode).toBe(500);
      expect(mockRes.data.error).toBe('Erro interno do Prisma');
    });

    test('status diferente de 500 continua incluindo error mesmo fora de development', () => {
      Constants.env = 'test';

      const mockReq = {};
      const mockRes = buildMockRes();
      const controller = new TestController(mockReq, mockRes);

      controller.handleError(new Error('Valor inválido'), 'validation.aula.invalidFilter', 400);

      expect(mockRes.statusCode).toBe(400);
      expect(mockRes.data.error).toBe('Valor inválido');
    });
  });
});
