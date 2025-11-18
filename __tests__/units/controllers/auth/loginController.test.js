import { LoginController } from '../../../../src/controllers/auth/loginController.js';
import { LoginService } from '../../../../src/services/auth/loginService.js';

describe('LoginController', () => {
  let mockReq;
  let mockRes;
  let originalLoginServiceHandle;

  beforeEach(() => {
    mockReq = {
      body: {}
    };

    mockRes = {
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.jsonData = data;
        return this;
      }
    };

    originalLoginServiceHandle = LoginService.handle;
  });

  afterEach(() => {
    LoginService.handle = originalLoginServiceHandle;
  });

  test('should return 400 when email is not provided', async () => {
    mockReq.body = { senha: 'password123' };

    const controller = new LoginController(mockReq, mockRes);
    await controller.execute();

    expect(mockRes.statusCode).toBe(400);
    expect(mockRes.jsonData).toEqual({ message: 'validation.no_credentials' });
  });

  test('should return 400 when senha is not provided', async () => {
    mockReq.body = { email: 'test@example.com' };

    const controller = new LoginController(mockReq, mockRes);
    await controller.execute();

    expect(mockRes.statusCode).toBe(400);
    expect(mockRes.jsonData).toEqual({ message: 'validation.no_credentials' });
  });

  test('should return 400 when both email and senha are not provided', async () => {
    mockReq.body = {};

    const controller = new LoginController(mockReq, mockRes);
    await controller.execute();

    expect(mockRes.statusCode).toBe(400);
    expect(mockRes.jsonData).toEqual({ message: 'validation.no_credentials' });
  });

  test('should return 400 when body is null or undefined', async () => {
    mockReq.body = null;

    const controller = new LoginController(mockReq, mockRes);
    await controller.execute();

    expect(mockRes.statusCode).toBe(400);
    expect(mockRes.jsonData).toEqual({ message: 'validation.no_credentials' });
  });

  test('should return 401 when LoginService returns null', async () => {
    mockReq.body = { email: 'test@example.com', senha: 'wrong-password' };
    LoginService.handle = async () => null;

    const controller = new LoginController(mockReq, mockRes);
    await controller.execute();

    expect(mockRes.statusCode).toBe(401);
    expect(mockRes.jsonData).toBe('auth.login.unauthorized');
  });

  test('should return 200 with token when credentials are valid', async () => {
    const mockToken = {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      tokenType: 'Bearer',
      expiresIn: 3600
    };

    mockReq.body = { email: 'test@example.com', senha: 'password123' };
    LoginService.handle = async () => mockToken;

    const controller = new LoginController(mockReq, mockRes);
    await controller.execute();

    expect(mockRes.statusCode).toBe(200);
    expect(mockRes.jsonData).toEqual(mockToken);
  });

  test('should call LoginService.handle with correct email and senha', async () => {
    let capturedEmail = null;
    let capturedSenha = null;

    mockReq.body = { email: 'test@example.com', senha: 'password123' };
    LoginService.handle = async (email, senha) => {
      capturedEmail = email;
      capturedSenha = senha;
      return null;
    };

    const controller = new LoginController(mockReq, mockRes);
    await controller.execute();

    expect(capturedEmail).toBe('test@example.com');
    expect(capturedSenha).toBe('password123');
  });

  test('should handle LoginService errors gracefully', async () => {
    mockReq.body = { email: 'test@example.com', senha: 'password123' };
    LoginService.handle = async () => {
      throw new Error('Database error');
    };

    let handleErrorCalled = false;
    let handleErrorError = null;
    let handleErrorKey = null;

    const controller = new LoginController(mockReq, mockRes);
    controller.handleError = (error, key) => {
      handleErrorCalled = true;
      handleErrorError = error;
      handleErrorKey = key;
    };

    await controller.execute();

    expect(handleErrorCalled).toBe(true);
    expect(handleErrorError).toBeInstanceOf(Error);
    expect(handleErrorKey).toBe('auth.login.error');
  });

  test('should call static handle method correctly', async () => {
    mockReq.body = { email: 'test@example.com', senha: 'password123' };
    LoginService.handle = async () => ({
      accessToken: 'token',
      refreshToken: 'refresh',
      tokenType: 'Bearer',
      expiresIn: 3600
    });

    await LoginController.handle(mockReq, mockRes);

    expect(mockRes.statusCode).toBe(200);
    expect(mockRes.jsonData).toBeDefined();
    expect(mockRes.jsonData.accessToken).toBe('token');
  });

  test('should return token with all required fields', async () => {
    const mockToken = {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      tokenType: 'Bearer',
      expiresIn: 3600
    };

    mockReq.body = { email: 'test@example.com', senha: 'password123' };
    LoginService.handle = async () => mockToken;

    const controller = new LoginController(mockReq, mockRes);
    await controller.execute();

    expect(mockRes.jsonData).toHaveProperty('accessToken');
    expect(mockRes.jsonData).toHaveProperty('refreshToken');
    expect(mockRes.jsonData).toHaveProperty('tokenType');
    expect(mockRes.jsonData).toHaveProperty('expiresIn');
  });

  test('should extract email and senha from request body', async () => {
    let receivedEmail = null;
    let receivedSenha = null;

    mockReq.body = { email: 'user@test.com', senha: 'secret123' };
    LoginService.handle = async (email, senha) => {
      receivedEmail = email;
      receivedSenha = senha;
      return null;
    };

    const controller = new LoginController(mockReq, mockRes);
    await controller.execute();

    expect(receivedEmail).toBe('user@test.com');
    expect(receivedSenha).toBe('secret123');
  });

  test('should not call LoginService when credentials are missing', async () => {
    let loginServiceCalled = false;

    mockReq.body = { email: 'test@example.com' };
    LoginService.handle = async () => {
      loginServiceCalled = true;
      return null;
    };

    const controller = new LoginController(mockReq, mockRes);
    await controller.execute();

    expect(loginServiceCalled).toBe(false);
    expect(mockRes.statusCode).toBe(400);
  });

  test('should handle missing request body gracefully', async () => {
    mockReq.body = undefined;

    const controller = new LoginController(mockReq, mockRes);
    await controller.execute();

    expect(mockRes.statusCode).toBe(400);
    expect(mockRes.jsonData).toEqual({ message: 'validation.no_credentials' });
  });
});
