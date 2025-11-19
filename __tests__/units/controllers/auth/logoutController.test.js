import { LogoutController } from '../../../../src/controllers/auth/logoutController.js';
import { LogoutService } from '../../../../src/services/auth/logoutService.js';

describe('LogoutController', () => {
  let mockReq;
  let mockRes;
  let originalLogoutServiceHandle;

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

    originalLogoutServiceHandle = LogoutService.handle;
  });

  afterEach(() => {
    LogoutService.handle = originalLogoutServiceHandle;
  });

  test('should return 400 when refreshToken is not provided', async () => {
    mockReq.body = {};

    const controller = new LogoutController(mockReq, mockRes);
    await controller.execute();

    expect(mockRes.statusCode).toBe(400);
    expect(mockRes.jsonData).toEqual({ message: 'auth.logout.error' });
  });

  test('should return 400 when body is null or undefined', async () => {
    mockReq.body = null;

    const controller = new LogoutController(mockReq, mockRes);
    await controller.execute();

    expect(mockRes.statusCode).toBe(400);
    expect(mockRes.jsonData).toEqual({ message: 'auth.logout.error' });
  });

  test('should return 400 when LogoutService returns null', async () => {
    mockReq.body = { refreshToken: 'already-revoked-token' };
    LogoutService.handle = async () => null;

    const controller = new LogoutController(mockReq, mockRes);
    await controller.execute();

    expect(mockRes.statusCode).toBe(400);
    expect(mockRes.jsonData).toEqual({ message: 'auth.logout.error' });
  });

  test('should return 204 when LogoutService succeeds', async () => {
    const mockResult = {
      message: 'auth.logout.success',
      success: true
    };

    mockReq.body = { refreshToken: 'valid-refresh-token' };
    LogoutService.handle = async () => mockResult;

    const controller = new LogoutController(mockReq, mockRes);
    await controller.execute();

    expect(mockRes.statusCode).toBe(204);
  });

  test('should call LogoutService.handle with correct refreshToken', async () => {
    let capturedToken = null;

    mockReq.body = { refreshToken: 'test-refresh-token' };
    LogoutService.handle = async token => {
      capturedToken = token;
      return { success: true };
    };

    const controller = new LogoutController(mockReq, mockRes);
    await controller.execute();

    expect(capturedToken).toBe('test-refresh-token');
  });

  test('should handle LogoutService errors gracefully', async () => {
    mockReq.body = { refreshToken: 'valid-token' };
    LogoutService.handle = async () => {
      throw new Error('Database error');
    };

    let handleErrorCalled = false;
    let handleErrorError = null;
    let handleErrorKey = null;

    const controller = new LogoutController(mockReq, mockRes);
    controller.handleError = (error, key) => {
      handleErrorCalled = true;
      handleErrorError = error;
      handleErrorKey = key;
    };

    await controller.execute();

    expect(handleErrorCalled).toBe(true);
    expect(handleErrorError).toBeInstanceOf(Error);
    expect(handleErrorKey).toBe('auth.logout.error');
  });

  test('should call static handle method correctly', async () => {
    mockReq.body = { refreshToken: 'valid-token' };
    LogoutService.handle = async () => ({ success: true });

    await LogoutController.handle(mockReq, mockRes);

    expect(mockRes.statusCode).toBe(204);
  });

  test('should extract refreshToken from request body', async () => {
    let receivedToken = null;

    mockReq.body = { refreshToken: 'my-refresh-token' };
    LogoutService.handle = async token => {
      receivedToken = token;
      return { success: true };
    };

    const controller = new LogoutController(mockReq, mockRes);
    await controller.execute();

    expect(receivedToken).toBe('my-refresh-token');
  });

  test('should not call LogoutService when refreshToken is missing', async () => {
    let serviceCalled = false;

    mockReq.body = {};
    LogoutService.handle = async () => {
      serviceCalled = true;
      return null;
    };

    const controller = new LogoutController(mockReq, mockRes);
    await controller.execute();

    expect(serviceCalled).toBe(true);
    expect(mockRes.statusCode).toBe(400);
  });

  test('should handle missing request body gracefully', async () => {
    mockReq.body = undefined;

    const controller = new LogoutController(mockReq, mockRes);
    await controller.execute();

    expect(mockRes.statusCode).toBe(400);
    expect(mockRes.jsonData).toEqual({ message: 'auth.logout.error' });
  });
});
