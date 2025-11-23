import LoggerManager from '../../../src/utilities/loggerManager.js';
import Constants from '../../../src/utilities/constants.js';
import { jest } from '@jest/globals';

describe('LoggerManager', () => {
  let logSpy;
  let errorSpy;
  let warnSpy;

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('expressLogger deve chamar console.log com o formato correto', () => {
    LoggerManager.expressLogger('Servidor iniciado');

    expect(logSpy).toHaveBeenCalledTimes(1);
    const call = logSpy.mock.calls[0][0];

    expect(call).toContain('[EXPRESS]');
    expect(call).toContain('Servidor iniciado');
  });

  test('info deve logar mensagem e meta', () => {
    LoggerManager.info('Processo OK', { id: 1 });

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('[INFO]'), { id: 1 });
  });

  test('error deve chamar console.error com mensagem e erro', () => {
    const fakeError = new Error('Falhou');

    LoggerManager.error('Erro ao salvar', fakeError);

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('[ERROR]'), fakeError);
  });

  test('warn deve chamar console.warn com mensagem e meta', () => {
    LoggerManager.warn('Atenção', { motivo: 'x' });

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('[WARN]'), { motivo: 'x' });
  });

  test('debug deve logar quando env não é production', () => {
    Constants.env = 'development';
    LoggerManager.debug('Debugando', { x: true });

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('[DEBUG]'), { x: true });
  });

  test('debug NÃO deve logar quando env é production', () => {
    Constants.env = 'production';
    LoggerManager.debug('Não deve aparecer');

    expect(logSpy).not.toHaveBeenCalled();
  });
});
