import { jest } from '@jest/globals';
import { EventEmitter } from 'node:events';
import logAuthDenials from '../../../../src/middlewares/auth/logAuthDenials.js';
import LoggerManager from '../../../../src/utilities/loggerManager.js';

describe('logAuthDenials', () => {
  let warn;

  beforeEach(() => {
    warn = jest.spyOn(LoggerManager, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const executar = (statusCode, reqExtra = {}) => {
    const req = {
      method: 'GET',
      originalUrl: '/api/alunos/abc',
      ip: '203.0.113.7',
      ...reqExtra
    };
    const res = new EventEmitter();
    res.statusCode = statusCode;
    const next = jest.fn();
    logAuthDenials(req, res, next);
    return { req, res, next };
  };

  test('chama next sem registrar nada antes do fim da resposta', () => {
    const { next } = executar(401);
    expect(next).toHaveBeenCalledTimes(1);
    expect(warn).not.toHaveBeenCalled();
  });

  test.each([401, 403])('%i: registra a negação com o objeto exato', status => {
    const { res } = executar(status, { user: { id: 'u1' } });
    res.emit('finish');

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith('auth.acesso_negado', {
      status,
      metodo: 'GET',
      rota: '/api/alunos/abc',
      userId: 'u1',
      ip: '203.0.113.7'
    });
  });

  test('rota sai sem query string e userId é nulo sem req.user', () => {
    const { res } = executar(403, {
      method: 'POST',
      originalUrl: '/api/professores?q=ana@example.com&nome=Ana'
    });
    res.emit('finish');

    expect(warn).toHaveBeenCalledWith('auth.acesso_negado', {
      status: 403,
      metodo: 'POST',
      rota: '/api/professores',
      userId: null,
      ip: '203.0.113.7'
    });
  });

  test('sem req.ip usa o valor padrão de getLoginClientIp', () => {
    const { res } = executar(401, { ip: undefined });
    res.emit('finish');
    expect(warn.mock.calls[0][1].ip).toBe('unknown');
  });

  test.each([200, 204, 400, 404, 429, 500, 503])('%i: nenhuma linha', status => {
    const { res } = executar(status);
    res.emit('finish');
    expect(warn).not.toHaveBeenCalled();
  });

  test('exceção ao registrar não propaga', () => {
    warn.mockImplementation(() => {
      throw new Error('falha de log');
    });
    const { res } = executar(401);
    expect(() => res.emit('finish')).not.toThrow();
    expect(warn).toHaveBeenCalledTimes(1);
  });
});
