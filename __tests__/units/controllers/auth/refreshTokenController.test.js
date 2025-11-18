import { RefreshTokenController } from '../../../../src/controllers/auth/refreshTokenController.js';
import { RefreshTokenService } from '../../../../src/services/auth/refreshTokenService.js';

describe('RefreshTokenController', () => {
  let mockReq;
  let mockRes;
  let originalRefreshTokenServiceHandle;

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

    originalRefreshTokenServiceHandle = RefreshTokenService.handle;
  });

  afterEach(() => {
    RefreshTokenService.handle = originalRefreshTokenServiceHandle;
  });

  test('should return 400 when refreshToken is not provided', async () => {
    mockReq.body = {};

    const controller = new RefreshTokenController(mockReq, mockRes);
    await controller.execute();

    expect(mockRes.statusCode).toBe(400);
    expect(mockRes.jsonData).toEqual({ message: 'validation.refresh_token_required' });
  });

  test('should return 400 when body is null or undefined', async () => {
    mockReq.body = null;

    const controller = new RefreshTokenController(mockReq, mockRes);
    await controller.execute();

    expect(mockRes.statusCode).toBe(400);
    expect(mockRes.jsonData).toEqual({ message: 'validation.refresh_token_required' });
  });

  test('should return 401 when RefreshTokenService returns null', async () => {
    mockReq.body = { refreshToken: 'invalid-token' };
    RefreshTokenService.handle = async () => null;

    const controller = new RefreshTokenController(mockReq, mockRes);
    await controller.execute();

    expect(mockRes.statusCode).toBe(401);
    expect(mockRes.jsonData).toEqual({ message: 'auth.refresh.unauthorized' });
  });

  test('should return 200 with new accessToken when refreshToken is valid', async () => {
    const mockToken = {
      accessToken: 'new-access-token',
      tokenType: 'Bearer',
      expiresIn: 3600
    };

    mockReq.body = { refreshToken: 'valid-refresh-token' };
    RefreshTokenService.handle = async () => mockToken;

    const controller = new RefreshTokenController(mockReq, mockRes);
    await controller.execute();

    expect(mockRes.statusCode).toBe(200);
    expect(mockRes.jsonData).toEqual(mockToken);
  });

  test('should call RefreshTokenService.handle with correct refreshToken', async () => {
    let capturedToken = null;

    mockReq.body = { refreshToken: 'test-refresh-token' };
    RefreshTokenService.handle = async token => {
      capturedToken = token;
      return null;
    };

    const controller = new RefreshTokenController(mockReq, mockRes);
    await controller.execute();

    expect(capturedToken).toBe('test-refresh-token');
  });

  test('should handle RefreshTokenService errors gracefully', async () => {
    mockReq.body = { refreshToken: 'valid-token' };
    RefreshTokenService.handle = async () => {
      throw new Error('Database error');
    };

    let handleErrorCalled = false;
    let handleErrorError = null;
    let handleErrorKey = null;

    const controller = new RefreshTokenController(mockReq, mockRes);
    controller.handleError = (error, key) => {
      handleErrorCalled = true;
      handleErrorError = error;
      handleErrorKey = key;
    };

    await controller.execute();

    expect(handleErrorCalled).toBe(true);
    expect(handleErrorError).toBeInstanceOf(Error);
    expect(handleErrorKey).toBe('auth.refresh.error');
  });

  test('should call static handle method correctly', async () => {
    mockReq.body = { refreshToken: 'valid-token' };
    RefreshTokenService.handle = async () => ({
      accessToken: 'new-token',
      tokenType: 'Bearer',
      expiresIn: 3600
    });

    await RefreshTokenController.handle(mockReq, mockRes);

    expect(mockRes.statusCode).toBe(200);
    expect(mockRes.jsonData).toBeDefined();
    expect(mockRes.jsonData.accessToken).toBe('new-token');
  });

  test('should return token with all required fields', async () => {
    const mockToken = {
      accessToken: 'new-access-token',
      tokenType: 'Bearer',
      expiresIn: 3600
    };

    mockReq.body = { refreshToken: 'valid-refresh-token' };
    RefreshTokenService.handle = async () => mockToken;

    const controller = new RefreshTokenController(mockReq, mockRes);
    await controller.execute();

    expect(mockRes.jsonData).toHaveProperty('accessToken');
    expect(mockRes.jsonData).toHaveProperty('tokenType');
    expect(mockRes.jsonData).toHaveProperty('expiresIn');
  });

  test('should extract refreshToken from request body', async () => {
    let receivedToken = null;

    mockReq.body = { refreshToken: 'my-refresh-token' };
    RefreshTokenService.handle = async token => {
      receivedToken = token;
      return null;
    };

    const controller = new RefreshTokenController(mockReq, mockRes);
    await controller.execute();

    expect(receivedToken).toBe('my-refresh-token');
  });

  test('should not call RefreshTokenService when refreshToken is missing', async () => {
    let serviceCalled = false;

    mockReq.body = {};
    RefreshTokenService.handle = async () => {
      serviceCalled = true;
      return null;
    };

    const controller = new RefreshTokenController(mockReq, mockRes);
    await controller.execute();

    expect(serviceCalled).toBe(false);
    expect(mockRes.statusCode).toBe(400);
  });
});
