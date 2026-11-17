import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import ErrorHandler, { ThrowErrors } from '../../../src/middlewares/error-handler.js';
import UnauthorizedError from '../../../src/utilities/errors/unauthorized.js';

// Mock das dependências
jest.mock('http-status', () => ({
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  INTERNAL_SERVER_ERROR: 500
}));

jest.mock('../../../src/utilities/constants.js', () => ({
  isProduction: false
}));

describe('ErrorHandler Middleware', () => {
  let req, res, err;

  beforeEach(() => {
    req = {
      t: jest.fn(key => {
        const translations = {
          'api.errors.bad_request': 'Requisição inválida',
          'api.errors.unauthorized': 'Não autorizado',
          'api.errors.internal_error': 'Erro interno do servidor'
        };
        return translations[key] || key;
      })
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    err = new Error('Test error');

    // Mock console.log para evitar logs durante testes
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  describe('Tratamento de erros de validação', () => {
    test('deve tratar erros com array de erros', () => {
      err.errors = [{ msg: 'Campo obrigatório' }, { msg: 'Formato inválido' }];

      ErrorHandler(err, req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Formato inválido', // Último erro do array
        message: 'Requisição inválida'
      });
    });

    test('deve tratar array vazio de erros', () => {
      err.errors = [];

      ErrorHandler(err, req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Test error',
        message: 'Erro interno do servidor'
      });
    });
  });

  describe('Tratamento de UnauthorizedError', () => {
    test('deve tratar UnauthorizedError corretamente', () => {
      err = new UnauthorizedError('Token inválido');

      ErrorHandler(err, req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'UnauthorizedError',
        message: 'Não autorizado'
      });
    });
  });

  describe('Tratamento de erros genéricos', () => {
    test('deve tratar erro genérico com mensagem', () => {
      err = new Error('Erro customizado');

      ErrorHandler(err, req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Erro customizado',
        message: 'Erro interno do servidor'
      });
    });

    test('deve tratar erro sem mensagem', () => {
      err = new Error();

      ErrorHandler(err, req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal Server Error',
        message: 'Erro interno do servidor'
      });
    });

    test('deve tratar erro com código', () => {
      err = { code: 'CUSTOM_ERROR', message: 'Erro personalizado' };

      ErrorHandler(err, req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Erro personalizado',
        message: 'Erro interno do servidor'
      });
    });
  });

  describe('Fallback de tradução', () => {
    test('deve usar fallback quando req.t não existe', () => {
      req.t = undefined;
      err = new Error('Test error');

      ErrorHandler(err, req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Test error',
        message: 'Erro interno do servidor'
      });
    });

    test('deve usar fallback quando req.t não é uma função', () => {
      req.t = 'not a function';
      err = new Error('Test error');

      ErrorHandler(err, req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Test error',
        message: 'Erro interno do servidor'
      });
    });

    test('deve retornar chave quando tradução não existe', () => {
      req.t = undefined;
      err.errors = [{ msg: 'Campo obrigatório' }];

      ErrorHandler(err, req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Campo obrigatório',
        message: 'Requisição inválida'
      });
    });
  });
});

describe('ThrowErrors Function', () => {
  test('deve lançar erros quando req.errorList existe e tem itens', () => {
    const req = {
      errorList: ['Erro 1', 'Erro 2']
    };

    expect(() => ThrowErrors(req)).toThrow();
  });

  test('não deve lançar erros quando req.errorList está vazio', () => {
    const req = {
      errorList: []
    };

    expect(() => ThrowErrors(req)).not.toThrow();
  });

  test('não deve lançar erros quando req.errorList não existe', () => {
    const req = {};

    expect(() => ThrowErrors(req)).not.toThrow();
  });

  test('não deve lançar erros quando req.errorList é undefined', () => {
    const req = {
      errorList: undefined
    };

    expect(() => ThrowErrors(req)).not.toThrow();
  });
});

describe('ErrorHandler - erros HTTP de cliente expostos', () => {
  let req, res;

  beforeEach(() => {
    req = {
      t: jest.fn(key => {
        const translations = {
          'api.errors.bad_request': 'Requisição inválida',
          'api.errors.payload_too_large': 'Corpo da requisição excede o tamanho permitido',
          'api.errors.internal_error': 'Erro interno do servidor'
        };
        return translations[key] || key;
      })
    };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  function httpError(status, extra = {}) {
    return Object.assign(new Error('mensagem interna'), { status, expose: true, ...extra });
  }

  test('erro exposto 413 responde 413 com a chave payload_too_large', () => {
    ErrorHandler(httpError(413, { body: 'conteudo-secreto' }), req, res);

    expect(res.status).toHaveBeenCalledWith(413);
    expect(res.json).toHaveBeenCalledWith({
      error: 'PayloadTooLarge',
      message: 'Corpo da requisição excede o tamanho permitido'
    });
  });

  test('erro exposto 400 preserva o status e responde BadRequest', () => {
    ErrorHandler(httpError(400, { body: 'conteudo-secreto' }), req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'BadRequest',
      message: 'Requisição inválida'
    });
  });

  test('erro exposto 415 via statusCode preserva o status', () => {
    ErrorHandler(httpError(undefined, { statusCode: 415 }), req, res);

    expect(res.status).toHaveBeenCalledWith(415);
  });

  test('a resposta não carrega o conteúdo da requisição nem a mensagem do erro', () => {
    ErrorHandler(httpError(413, { body: 'conteudo-secreto' }), req, res);

    const serializado = JSON.stringify(res.json.mock.calls[0][0]);
    expect(serializado).not.toContain('conteudo-secreto');
    expect(serializado).not.toContain('mensagem interna');
  });

  test('erro comum continua respondendo 500', () => {
    ErrorHandler(new Error('falha'), req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('status 413 sem expose responde 500 (fail secure)', () => {
    ErrorHandler(httpError(413, { expose: undefined }), req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('expose true com status 5xx responde 500', () => {
    ErrorHandler(httpError(503), req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('sem req.t usa o fallback local em português para 413', () => {
    ErrorHandler(httpError(413), {}, res);

    expect(res.json).toHaveBeenCalledWith({
      error: 'PayloadTooLarge',
      message: 'Corpo da requisição excede o tamanho permitido'
    });
  });
});
