import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import ErrorHandler, { ThrowErrors } from '../../src/middlewares/error-handler.js';
import UnauthorizedError from '../../src/utilities/errors/unauthorized.js';

// Mock das dependências
jest.mock('http-status', () => ({
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  INTERNAL_SERVER_ERROR: 500
}));

jest.mock('../../src/utilities/constants.js', () => ({
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
