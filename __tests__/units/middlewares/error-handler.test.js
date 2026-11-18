import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import ErrorHandler, { ThrowErrors } from '../../../src/middlewares/error-handler.js';
import Constants from '../../../src/utilities/constants.js';
import UnauthorizedError from '../../../src/utilities/errors/unauthorized.js';
import ServiceUnavailableError from '../../../src/utilities/errors/serviceUnavailable.js';
import { capturarLog } from '../../mocks/capturaDeLog.js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Mock das dependências
jest.mock('http-status', () => ({
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  INTERNAL_SERVER_ERROR: 500
}));

describe('ErrorHandler Middleware', () => {
  const originalEnv = Constants.env;
  const originalIsProduction = Constants.isProduction;
  let req, res, err;

  afterEach(() => {
    Constants.env = originalEnv;
    Constants.isProduction = originalIsProduction;
  });

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
    Constants.env = 'test';
    Constants.isProduction = false;

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
        error: 'Internal Server Error',
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
        error: 'Internal Server Error',
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
        error: 'Internal Server Error',
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
        error: 'Internal Server Error',
        message: 'Erro interno do servidor'
      });
    });

    test('deve usar fallback quando req.t não é uma função', () => {
      req.t = 'not a function';
      err = new Error('Test error');

      ErrorHandler(err, req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal Server Error',
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

describe('ErrorHandler - erros HTTP 4xx expostos', () => {
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

  test('erro 4xx exposto responde status e mensagem traduzida fixa', () => {
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

describe('ErrorHandler - detalhe do erro interno na resposta', () => {
  const originalEnv = Constants.env;
  const originalIsProduction = Constants.isProduction;
  const mensagemInterna = 'Invalid `prisma.aluno.create()` coluna secreta_xyz';
  let req, res, errorSpy, logSpy;

  function prismaError() {
    return Object.assign(new Error(mensagemInterna), {
      name: 'PrismaClientKnownRequestError',
      code: 'P2002',
      meta: { target: 'valor-sensivel' }
    });
  }

  beforeEach(() => {
    req = {
      t: jest.fn(key => (key === 'api.errors.internal_error' ? 'Erro interno do servidor' : key))
    };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    Constants.env = originalEnv;
    Constants.isProduction = originalIsProduction;
  });

  test.each(['production', 'test', 'homolog'])(
    'fora de development (%s) responde 500 com texto fixo e sem a mensagem interna',
    env => {
      Constants.env = env;
      Constants.isProduction = env === 'production';

      ErrorHandler(prismaError(), req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      const body = res.json.mock.calls[0][0];
      expect(body).toEqual({
        error: 'Internal Server Error',
        message: 'Erro interno do servidor'
      });
      expect(JSON.stringify(body)).not.toContain('secreta_xyz');
    }
  );

  test('em produção registra o erro redigido, sem message nem valores', () => {
    Constants.env = 'production';
    Constants.isProduction = true;

    ErrorHandler(prismaError(), req, res);

    expect(errorSpy).toHaveBeenCalledWith('[ErrorHandler] Erro:', {
      name: 'PrismaClientKnownRequestError',
      code: 'P2002',
      meta: ['target']
    });
    expect(logSpy).not.toHaveBeenCalled();
  });

  test('fora de produção mantém o log do erro completo', () => {
    Constants.env = 'test';
    Constants.isProduction = false;
    const err = prismaError();

    ErrorHandler(err, req, res);

    expect(logSpy).toHaveBeenCalledWith(err);
    expect(errorSpy).not.toHaveBeenCalled();
  });

  test('em development inclui error com a mensagem', () => {
    Constants.env = 'development';

    ErrorHandler(prismaError(), req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: mensagemInterna,
      message: 'Erro interno do servidor'
    });
  });

  test('em development com erro sem mensagem usa Internal Server Error', () => {
    Constants.env = 'development';

    ErrorHandler(new Error(), req, res);

    expect(res.json).toHaveBeenCalledWith({
      error: 'Internal Server Error',
      message: 'Erro interno do servidor'
    });
  });
});

describe('ErrorHandler - ServiceUnavailableError', () => {
  const SENTINELA = 'SENTINELA-503-CAUSA';
  let req, res;

  function erroComCausa() {
    const causa = Object.assign(new Error(`falha ${SENTINELA}`), {
      name: 'PrismaClientKnownRequestError'
    });
    const err = new ServiceUnavailableError();
    err.cause = causa;
    return err;
  }

  beforeEach(() => {
    req = {
      t: jest.fn(key =>
        key === 'api.errors.service_unavailable' ? 'Indisponível (traduzido)' : key
      )
    };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('responde 503 com o corpo exato e chama req.t com a chave', () => {
    capturarLog();

    ErrorHandler(new ServiceUnavailableError(), req, res);

    expect(res.status).toHaveBeenCalledWith(503);
    const body = res.json.mock.calls[0][0];
    expect(body).toEqual({
      error: 'ServiceUnavailableError',
      message: 'Indisponível (traduzido)'
    });
    expect(Object.keys(body)).toHaveLength(2);
    expect(req.t.mock.calls[0][0]).toBe('api.errors.service_unavailable');
  });

  test('sem req.t o message é o fallback em português, não a chave', () => {
    capturarLog();

    ErrorHandler(new ServiceUnavailableError(), {}, res);

    expect(res.json).toHaveBeenCalledWith({
      error: 'ServiceUnavailableError',
      message: 'Serviço temporariamente indisponível'
    });
  });

  test('nada do erro de origem vai ao log nem ao corpo', () => {
    const captura = capturarLog();

    ErrorHandler(erroComCausa(), req, res);

    expect(captura.texto()).not.toContain(SENTINELA);
    expect(JSON.stringify(res.json.mock.calls[0][0])).not.toContain(SENTINELA);
  });

  test('controle de detecção: a captura enxerga o sentinela num console.error', () => {
    const captura = capturarLog();

    console.error('[x]', erroComCausa().cause);

    expect(captura.texto()).toContain(SENTINELA);
  });

  test('controle positivo: o ramo 503 emite o rótulo fixo no log', () => {
    const captura = capturarLog();

    ErrorHandler(erroComCausa(), req, res);

    const ocorrencias = captura.texto().split('Serviço temporariamente indisponível').length - 1;
    expect(ocorrencias).toBeGreaterThanOrEqual(1);
  });

  test('chave i18n existe nos dois idiomas e difere entre eles', () => {
    const ler = lang =>
      JSON.parse(readFileSync(resolve('src/locales', lang, 'translation.json'), 'utf8'));
    const pt = ler('pt').api.errors.service_unavailable;
    const en = ler('en').api.errors.service_unavailable;

    expect(typeof pt).toBe('string');
    expect(pt.length).toBeGreaterThan(0);
    expect(typeof en).toBe('string');
    expect(en.length).toBeGreaterThan(0);
    expect(pt).not.toBe(en);
  });
});
