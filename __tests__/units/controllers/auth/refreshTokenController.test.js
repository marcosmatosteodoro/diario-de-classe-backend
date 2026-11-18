import { jest } from '@jest/globals';
import { RefreshTokenController } from '../../../../src/controllers/auth/refreshTokenController.js';
import { RefreshTokenService } from '../../../../src/services/auth/refreshTokenService.js';
import Constants from '../../../../src/utilities/constants.js';
import ServiceUnavailableError from '../../../../src/utilities/errors/serviceUnavailable.js';

const COOKIE = Constants.sessionCookie.name;

describe('RefreshTokenController', () => {
  let req;
  let res;
  let handleOriginal;

  beforeEach(() => {
    req = { body: {}, cookies: {}, t: jest.fn(chave => chave) };
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
