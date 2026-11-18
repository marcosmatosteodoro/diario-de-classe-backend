import { jest } from '@jest/globals';
import { RefreshTokenController } from '../../../../src/controllers/auth/refreshTokenController.js';
import { RefreshTokenService } from '../../../../src/services/auth/refreshTokenService.js';
import Constants from '../../../../src/utilities/constants.js';
import LoggerManager from '../../../../src/utilities/loggerManager.js';
import { getLoginClientIp } from '../../../../src/utilities/loginAttemptKeys.js';
import ServiceUnavailableError from '../../../../src/utilities/errors/serviceUnavailable.js';

const COOKIE = Constants.sessionCookie.name;

describe('RefreshTokenController', () => {
  let req;
  let res;
  let handleOriginal;

  beforeEach(() => {
    req = { body: {}, cookies: {}, ip: '203.0.113.7', t: jest.fn(chave => chave) };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      clearCookie: jest.fn(),
      cookie: jest.fn()
    };
    handleOriginal = RefreshTokenService.handle;
    RefreshTokenService.handle = jest.fn();
  });

  afterEach(() => {
    RefreshTokenService.handle = handleOriginal;
  });

  test('lê o refresh do cookie e o entrega ao service', async () => {
    req.cookies[COOKIE] = 'refresh-do-cookie';
    RefreshTokenService.handle.mockResolvedValue({
      accessToken: 'a',
      refreshToken: 'r',
      restanteSegundos: 10
    });

    await RefreshTokenController.handle(req, res);

    expect(RefreshTokenService.handle).toHaveBeenCalledWith('refresh-do-cookie');
  });

  test('ignora o corpo: refresh só no corpo chega ao service como ausente', async () => {
    req.body = { refreshToken: 'refresh-do-corpo' };
    RefreshTokenService.handle.mockResolvedValue(false);

    await RefreshTokenController.handle(req, res);

    expect(RefreshTokenService.handle).toHaveBeenCalledWith(null);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('recusa do service responde 401 e remove o cookie', async () => {
    req.cookies[COOKIE] = 'x';
    RefreshTokenService.handle.mockResolvedValue(false);

    await new RefreshTokenController(req, res).execute();

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'auth.refresh.unauthorized' });
    expect(res.clearCookie).toHaveBeenCalledTimes(1);
    expect(res.clearCookie.mock.calls[0][0]).toBe(COOKIE);
  });

  describe('reuso (DEC-005-024)', () => {
    const REUSO = { reuso: { idUsuario: 'u-1', idSessao: 'sessao-1' } };

    test('responde como a recusa e registra o evento com exatamente idUsuario, idSessao e ip, antes do status', async () => {
      req.cookies[COOKIE] = 'x';
      RefreshTokenService.handle.mockResolvedValue(REUSO);
      const ordem = [];
      const warn = jest
        .spyOn(LoggerManager, 'warn')
        .mockImplementation((...args) => ordem.push(['warn', ...args]));
      res.status.mockImplementation(codigo => {
        ordem.push(['status', codigo]);
        return res;
      });

      await new RefreshTokenController(req, res).execute();

      expect(warn).toHaveBeenCalledTimes(1);
      expect(ordem[0]).toEqual([
        'warn',
        'auth.sessao.reuso',
        { idUsuario: 'u-1', idSessao: 'sessao-1', ip: getLoginClientIp(req) }
      ]);
      expect(getLoginClientIp(req)).toBe('203.0.113.7');
      expect(ordem[1]).toEqual(['status', 401]);
      expect(res.json).toHaveBeenCalledWith({ message: 'auth.refresh.unauthorized' });
      expect(res.clearCookie).toHaveBeenCalledTimes(1);
      expect(res.clearCookie.mock.calls[0][0]).toBe(COOKIE);
      expect(res.cookie).not.toHaveBeenCalled();
    });

    test('recusa simples (false) não registra o evento', async () => {
      RefreshTokenService.handle.mockResolvedValue(false);
      const warn = jest.spyOn(LoggerManager, 'warn').mockImplementation(() => {});

      await new RefreshTokenController(req, res).execute();

      expect(res.status).toHaveBeenCalledWith(401);
      expect(warn).not.toHaveBeenCalled();
    });
  });

  test('sucesso grava o cookie com (res, refresh, restanteSegundos) e responde 200 sem refreshToken no corpo', async () => {
    req.cookies[COOKIE] = 'x';
    const corpo = { accessToken: 'a', tokenType: 'Bearer', user: { id: 'u1' }, configuracao: null };
    RefreshTokenService.handle.mockResolvedValue({
      ...corpo,
      refreshToken: 'refresh-novo',
      restanteSegundos: 500000
    });

    await new RefreshTokenController(req, res).execute();

    expect(res.cookie).toHaveBeenCalledTimes(1);
    const [nome, valor, opcoes] = res.cookie.mock.calls[0];
    expect([nome, valor, opcoes.maxAge]).toEqual([COOKIE, 'refresh-novo', 500000 * 1000]);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(corpo);
    expect(res.json.mock.calls[0][0]).not.toHaveProperty('refreshToken');
    expect(res.json.mock.calls[0][0]).not.toHaveProperty('restanteSegundos');
    expect(res.clearCookie).not.toHaveBeenCalled();
  });

  test('recusa não grava cookie algum', async () => {
    RefreshTokenService.handle.mockResolvedValue(false);

    await new RefreshTokenController(req, res).execute();

    expect(res.cookie).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('ServiceUnavailableError é relançada, sem tocar o cookie e sem handleError', async () => {
    req.cookies[COOKIE] = 'x';
    const erro = new ServiceUnavailableError();
    RefreshTokenService.handle.mockRejectedValue(erro);
    const controller = new RefreshTokenController(req, res);
    controller.handleError = jest.fn();

    await expect(controller.execute()).rejects.toBe(erro);

    expect(res.clearCookie).not.toHaveBeenCalled();
    expect(res.cookie).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(controller.handleError).not.toHaveBeenCalled();
  });

  test('exceção vai para handleError sem emitir acesso e sem mexer no cookie', async () => {
    req.cookies[COOKIE] = 'x';
    const erro = new Error('falha');
    RefreshTokenService.handle.mockRejectedValue(erro);
    const controller = new RefreshTokenController(req, res);
    controller.handleError = jest.fn();

    await controller.execute();

    expect(controller.handleError).toHaveBeenCalledWith(erro, 'auth.refresh.error');
    expect(res.status).not.toHaveBeenCalled();
    expect(res.clearCookie).not.toHaveBeenCalled();
    expect(res.cookie).not.toHaveBeenCalled();
  });
});
