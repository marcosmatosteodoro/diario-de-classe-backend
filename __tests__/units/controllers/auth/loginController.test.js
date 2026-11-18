import { jest } from '@jest/globals';
import { LoginController } from '../../../../src/controllers/auth/loginController.js';
import LoggerManager from '../../../../src/utilities/loggerManager.js';
import { LoginService } from '../../../../src/services/auth/loginService.js';

describe('LoginController', () => {
  let req;
  let res;
  let original;

  beforeEach(() => {
    req = { body: { email: 'a@example.com', senha: 'segredo' }, t: key => key };
    res = {
      status: jest.fn(function () {
        return this;
      }),
      json: jest.fn(function () {
        return this;
      }),
      cookie: jest.fn(),
      clearCookie: jest.fn()
    };
    original = LoginService.handle;
  });

  afterEach(() => {
    LoginService.handle = original;
  });

  test('200: grava o refresh no cookie e responde sem refreshToken', async () => {
    LoginService.handle = async (email, senha) => {
      expect([email, senha]).toEqual(['a@example.com', 'segredo']);
      return {
        accessToken: 'AT',
        refreshToken: 'RT',
        tokenType: 'Bearer',
        expiresIn: 900,
        user: { id: 'u1' },
        configuracao: { id: 'c1' }
      };
    };

    await LoginController.handle(req, res);

    expect(res.cookie).toHaveBeenCalledTimes(1);
    expect(res.cookie.mock.calls[0][0]).toBe('bls_sessao');
    expect(res.cookie.mock.calls[0][1]).toBe('RT');
    expect(res.status).toHaveBeenCalledWith(200);
    const corpo = res.json.mock.calls[0][0];
    expect(corpo).not.toHaveProperty('refreshToken');
    expect(corpo).toEqual({
      accessToken: 'AT',
      tokenType: 'Bearer',
      expiresIn: 900,
      user: { id: 'u1' },
      configuracao: { id: 'c1' }
    });
  });

  test('401: service devolve null e nenhum cookie é gravado nem removido', async () => {
    LoginService.handle = async () => null;

    await LoginController.handle(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'auth.login.unauthorized' });
    expect(res.cookie).not.toHaveBeenCalled();
    expect(res.clearCookie).not.toHaveBeenCalled();
  });

  test.each([{}, null, { email: 'a@example.com' }, { senha: 'x' }])(
    '401 sem chamar o service quando o corpo é %j',
    async body => {
      req.body = body;
      LoginService.handle = jest.fn();

      await LoginController.handle(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(LoginService.handle).not.toHaveBeenCalled();
      expect(res.cookie).not.toHaveBeenCalled();
    }
  );

  test('falha do service vira handleError com a chave de erro do login', async () => {
    LoginService.handle = async () => {
      throw new Error('falha');
    };
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await LoginController.handle(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json.mock.calls[0][0].message).toBe('auth.login.error');
    expect(res.cookie).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  test('200: registra o login com userId e ip, sem e-mail, senha nem tokens', async () => {
    req.ip = '203.0.113.7';
    LoginService.handle = async () => ({
      accessToken: 'AT',
      refreshToken: 'RT',
      tokenType: 'Bearer',
      expiresIn: 900,
      user: { id: 'u1', email: 'a@example.com' },
      configuracao: { id: 'c1' }
    });
    const info = jest.spyOn(LoggerManager, 'info').mockImplementation(() => {});

    await LoginController.handle(req, res);

    expect(info).toHaveBeenCalledTimes(1);
    expect(info).toHaveBeenCalledWith('auth.login.ok', { userId: 'u1', ip: '203.0.113.7' });
    info.mockRestore();
  });

  test('401: login recusado não registra auth.login.ok', async () => {
    LoginService.handle = async () => null;
    const info = jest.spyOn(LoggerManager, 'info').mockImplementation(() => {});
    const warn = jest.spyOn(LoggerManager, 'warn').mockImplementation(() => {});

    await LoginController.handle(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(info).not.toHaveBeenCalled();
    info.mockRestore();
    warn.mockRestore();
  });
});
