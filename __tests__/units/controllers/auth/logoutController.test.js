import { jest } from '@jest/globals';
import { LogoutController } from '../../../../src/controllers/auth/logoutController.js';
import LoggerManager from '../../../../src/utilities/loggerManager.js';
import { LogoutService } from '../../../../src/services/auth/logoutService.js';
import Constants from '../../../../src/utilities/constants.js';

const COOKIE = Constants.sessionCookie.name;

describe('LogoutController', () => {
  let req;
  let res;
  let handleOriginal;

  beforeEach(() => {
    req = { body: {}, cookies: {}, t: jest.fn(chave => chave) };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      clearCookie: jest.fn()
    };
    handleOriginal = LogoutService.handle;
    LogoutService.handle = jest.fn();
  });

  afterEach(() => {
    LogoutService.handle = handleOriginal;
  });

  const removeuOCookie = () => {
    expect(res.clearCookie).toHaveBeenCalledTimes(1);
    expect(res.clearCookie.mock.calls[0][0]).toBe(COOKIE);
  };

  test('com cookie: entrega o valor ao service, responde 204 e remove o cookie', async () => {
    req.cookies[COOKIE] = 'refresh-do-cookie';
    LogoutService.handle.mockResolvedValue({ revogado: true });

    await LogoutController.handle(req, res);

    expect(LogoutService.handle).toHaveBeenCalledWith('refresh-do-cookie');
    expect(res.status).toHaveBeenCalledWith(204);
    removeuOCookie();
  });

  test('sem cookie: 204 e remoção, sem mensagem de erro', async () => {
    LogoutService.handle.mockResolvedValue({ revogado: false });

    await new LogoutController(req, res).execute();

    expect(LogoutService.handle).toHaveBeenCalledWith(null);
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.json).toHaveBeenCalledWith();
    removeuOCookie();
  });

  test('ignora o corpo', async () => {
    req.body = { refreshToken: 'do-corpo' };
    LogoutService.handle.mockResolvedValue({ revogado: false });

    await new LogoutController(req, res).execute();

    expect(LogoutService.handle).toHaveBeenCalledWith(null);
  });

  test('erro do ORM no encerramento: handleError, sem 204 e com o cookie mantido', async () => {
    req.cookies[COOKIE] = 'x';
    const erro = new Error('Invalid invocation SENTINELA-SAIR-500');
    erro.name = 'PrismaClientKnownRequestError';
    LogoutService.handle.mockRejectedValue(erro);
    const controller = new LogoutController(req, res);
    controller.handleError = jest.fn();

    await controller.execute();

    expect(controller.handleError).toHaveBeenCalledTimes(1);
    expect(controller.handleError).toHaveBeenCalledWith(erro, 'auth.logout.error');
    expect(res.status).not.toHaveBeenCalledWith(204);
    expect(res.clearCookie).not.toHaveBeenCalled();
  });

  test('exceção vai para handleError e o cookie permanece', async () => {
    req.cookies[COOKIE] = 'x';
    const erro = new Error('falha');
    LogoutService.handle.mockRejectedValue(erro);
    const controller = new LogoutController(req, res);
    controller.handleError = jest.fn();

    await controller.execute();

    expect(controller.handleError).toHaveBeenCalledWith(erro, 'auth.logout.error');
    expect(res.status).not.toHaveBeenCalled();
    expect(res.clearCookie).not.toHaveBeenCalled();
  });

  test.each([true, false])(
    'registra o logout com revogado=%s e ip, sem o token',
    async revogado => {
      req.ip = '203.0.113.7';
      req.cookies[COOKIE] = 'refresh-do-cookie';
      LogoutService.handle.mockResolvedValue({ revogado });
      const info = jest.spyOn(LoggerManager, 'info').mockImplementation(() => {});

      await LogoutController.handle(req, res);

      expect(info).toHaveBeenCalledTimes(1);
      expect(info).toHaveBeenCalledWith('auth.logout', { revogado, ip: '203.0.113.7' });
      info.mockRestore();
    }
  );
});
