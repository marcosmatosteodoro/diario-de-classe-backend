import util from 'node:util';
import { jest } from '@jest/globals';
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

  describe('handleError - redação de erros do Prisma no log (DEC-002-006, CWE-532)', () => {
    const SENTINELA = 'senha-sentinela-nao-pode-vazar-no-log';

    let errorSpy;

    beforeEach(() => {
      errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      errorSpy.mockRestore();
    });

    function textoLogado() {
      return errorSpy.mock.calls
        .flat()
        .map(arg => util.inspect(arg, { depth: null }))
        .join(' ');
    }

    test('erro com name PrismaClientValidationError: texto logado não contém a senha e contém o name', () => {
      const mockReq = {};
      const mockRes = buildMockRes();
      const controller = new TestController(mockReq, mockRes);

      const error = new Error(`Invalid \`prisma.user.update()\` invocation: senha: "${SENTINELA}"`);
      error.name = 'PrismaClientValidationError';

      controller.handleError(error);

      expect(textoLogado()).not.toContain(SENTINELA);
      expect(textoLogado()).toContain('PrismaClientValidationError');
    });

    test('erro com name PrismaClientKnownRequestError: texto logado traz name, code e chaves de meta, nunca valores', () => {
      const mockReq = {};
      const mockRes = buildMockRes();
      const controller = new TestController(mockReq, mockRes);

      const error = new Error(`Unique constraint failed: senha "${SENTINELA}"`);
      error.name = 'PrismaClientKnownRequestError';
      error.code = 'P2002';
      error.meta = { target: 'email', senha: SENTINELA };

      controller.handleError(error);

      const texto = textoLogado();
      expect(texto).toContain('PrismaClientKnownRequestError');
      expect(texto).toContain('P2002');
      expect(texto).toContain('target');
      expect(texto).toContain('senha');
      expect(texto).not.toContain(SENTINELA);
    });

    test('controle: erro comum (não-Prisma) continua logado como hoje, sem redação', () => {
      const mockReq = {};
      const mockRes = buildMockRes();
      const controller = new TestController(mockReq, mockRes);

      controller.handleError(new Error('falha X'));

      expect(textoLogado()).toContain('falha X');
    });
  });

  describe('getWhereClauseByQuerySearch()', () => {
    class TestController extends AbstractController {
      async execute() {
        return 'test';
      }

      static async handle(req, res) {
        const controller = new TestController(req, res);
        return await controller.execute();
      }
    }

    test('BI-31: quando já existe OR de autorização, combina com o OR da busca via AND (não sobrescreve)', () => {
      const mockReq = {};
      const mockRes = {};
      const controller = new TestController(mockReq, mockRes);

      controller.where = { OR: [{ a: 1 }] };

      controller.getWhereClauseByQuerySearch({ query: 'x', fields: ['nome'] });

      expect(controller.where).toEqual({
        AND: [{ OR: [{ a: 1 }] }, { OR: [{ nome: { contains: 'x' } }] }]
      });
    });

    test('BI-31: preserva demais chaves de this.where ao combinar autorização com busca', () => {
      const mockReq = {};
      const mockRes = {};
      const controller = new TestController(mockReq, mockRes);

      controller.where = { OR: [{ a: 1 }], ativo: true };

      controller.getWhereClauseByQuerySearch({ query: 'y', fields: ['nome'] });

      expect(controller.where).toEqual({
        ativo: true,
        AND: [{ OR: [{ a: 1 }] }, { OR: [{ nome: { contains: 'y' } }] }]
      });
    });

    test('sem OR prévio, mantém o comportamento antigo (atribuição direta)', () => {
      const mockReq = {};
      const mockRes = {};
      const controller = new TestController(mockReq, mockRes);

      controller.getWhereClauseByQuerySearch({
        query: 'z',
        fields: ['nome', 'email']
      });

      expect(controller.where).toEqual({
        OR: [{ nome: { contains: 'z' } }, { email: { contains: 'z' } }]
      });
    });
  });
});
