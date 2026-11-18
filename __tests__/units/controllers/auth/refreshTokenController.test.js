import { jest } from '@jest/globals';
import { RefreshTokenController } from '../../../../src/controllers/auth/refreshTokenController.js';
import { RefreshTokenService } from '../../../../src/services/auth/refreshTokenService.js';
import Constants from '../../../../src/utilities/constants.js';

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
      clearCookie: jest.fn()
    };
    handleOriginal = RefreshTokenService.handle;
    RefreshTokenService.handle = jest.fn();
  });

  afterEach(() => {
    RefreshTokenService.handle = handleOriginal;
  });

  test('lê o refresh do cookie e o entrega ao service', async () => {
    req.cookies[COOKIE] = 'refresh-do-cookie';
    RefreshTokenService.handle.mockResolvedValue({ accessToken: 'a' });

    await RefreshTokenController.handle(req, res);

    expect(RefreshTokenService.handle).toHaveBeenCalledWith('refresh-do-cookie');
  });

  test('ignora o corpo: refresh só no corpo chega ao service como ausente', async () => {
    req.body = { refreshToken: 'refresh-do-corpo' };
    RefreshTokenService.handle.mockResolvedValue(null);

    await RefreshTokenController.handle(req, res);

    expect(RefreshTokenService.handle).toHaveBeenCalledWith(null);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('recusa do service responde 401 e remove o cookie', async () => {
    req.cookies[COOKIE] = 'x';
    RefreshTokenService.handle.mockResolvedValue(null);

    await new RefreshTokenController(req, res).execute();

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'auth.refresh.unauthorized' });
    expect(res.clearCookie).toHaveBeenCalledTimes(1);
    expect(res.clearCookie.mock.calls[0][0]).toBe(COOKIE);
  });

  test('sucesso responde 200 com o corpo do service e não mexe no cookie', async () => {
    req.cookies[COOKIE] = 'x';
    const corpo = { accessToken: 'a', tokenType: 'Bearer', user: { id: 'u1' }, configuracao: null };
    RefreshTokenService.handle.mockResolvedValue(corpo);

    await new RefreshTokenController(req, res).execute();

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(corpo);
    expect(res.clearCookie).not.toHaveBeenCalled();
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
  });
});
