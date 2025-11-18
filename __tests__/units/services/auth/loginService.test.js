import { LoginService } from '../../../../src/services/auth/loginService.js';
import UserRepository from '../../../../src/repositories/userRepository.js';
import Constants from '../../../../src/utilities/constants.js';

describe('LoginService', () => {
  let originalSelectOne;

  beforeEach(() => {
    originalSelectOne = UserRepository.prototype.selectOne;
  });

  afterEach(() => {
    UserRepository.prototype.selectOne = originalSelectOne;
  });

  test('should return null when email is not provided', async () => {
    const service = new LoginService(UserRepository, '', 'password123');
    const result = await service.execute();

    expect(result).toBeNull();
  });

  test('should return null when senha is not provided', async () => {
    const service = new LoginService(UserRepository, 'test@example.com', '');
    const result = await service.execute();

    expect(result).toBeNull();
  });

  test('should return null when both email and senha are not provided', async () => {
    const service = new LoginService(UserRepository, '', '');
    const result = await service.execute();

    expect(result).toBeNull();
  });

  test('should return null when user is not found', async () => {
    UserRepository.prototype.selectOne = async () => null;

    const service = new LoginService(UserRepository, 'notfound@example.com', 'password123');
    const result = await service.execute();

    expect(result).toBeNull();
  });

  test('should return null when senha does not match', async () => {
    UserRepository.prototype.selectOne = async () => ({
      id: '1',
      email: 'test@example.com',
      nome: 'Test User',
      senha: 'correct-password'
    });

    const service = new LoginService(UserRepository, 'test@example.com', 'wrong-password');
    const result = await service.execute();

    expect(result).toBeNull();
  });

  test('should return tokens when credentials are valid', async () => {
    UserRepository.prototype.selectOne = async () => ({
      id: 'user-123',
      email: 'test@example.com',
      nome: 'Test User',
      senha: 'password123'
    });

    const service = new LoginService(UserRepository, 'test@example.com', 'password123');
    const result = await service.execute();

    expect(result).not.toBeNull();
    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('refreshToken');
    expect(result).toHaveProperty('tokenType');
    expect(result).toHaveProperty('expiresIn');
  });

  test('should return correct tokenType', async () => {
    UserRepository.prototype.selectOne = async () => ({
      id: 'user-123',
      email: 'test@example.com',
      nome: 'Test User',
      senha: 'password123'
    });

    const service = new LoginService(UserRepository, 'test@example.com', 'password123');
    const result = await service.execute();

    expect(result.tokenType).toBe('Bearer');
  });

  test('should return correct expiresIn', async () => {
    UserRepository.prototype.selectOne = async () => ({
      id: 'user-123',
      email: 'test@example.com',
      nome: 'Test User',
      senha: 'password123'
    });

    const service = new LoginService(UserRepository, 'test@example.com', 'password123');
    const result = await service.execute();

    expect(result.expiresIn).toBe(Constants.accessExp);
  });

  test('should generate valid JWT tokens', async () => {
    UserRepository.prototype.selectOne = async () => ({
      id: 'user-123',
      email: 'test@example.com',
      nome: 'Test User',
      senha: 'password123'
    });

    const service = new LoginService(UserRepository, 'test@example.com', 'password123');
    const result = await service.execute();

    // JWT should have three parts separated by dots
    const accessParts = result.accessToken.split('.');
    const refreshParts = result.refreshToken.split('.');

    expect(accessParts.length).toBe(3);
    expect(refreshParts.length).toBe(3);
  });

  test('should call selectOne with correct email filter', async () => {
    let capturedParams = null;
    UserRepository.prototype.selectOne = async params => {
      capturedParams = params;
      return {
        id: 'user-123',
        email: 'test@example.com',
        nome: 'Test User',
        senha: 'password123'
      };
    };

    const service = new LoginService(UserRepository, 'test@example.com', 'password123');
    await service.execute();

    expect(capturedParams.where.email).toBe('test@example.com');
  });

  test('should handle static handle method with valid credentials', async () => {
    UserRepository.prototype.selectOne = async () => ({
      id: 'user-123',
      email: 'test@example.com',
      nome: 'Test User',
      senha: 'password123'
    });

    const result = await LoginService.handle('test@example.com', 'password123');

    expect(result).not.toBeNull();
    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('refreshToken');
  });

  test('should handle static handle method with invalid credentials', async () => {
    UserRepository.prototype.selectOne = async () => null;

    const result = await LoginService.handle('notfound@example.com', 'password123');

    expect(result).toBeNull();
  });

  test('should generate different tokens for different users', async () => {
    let callCount = 0;
    UserRepository.prototype.selectOne = async () => {
      callCount++;
      if (callCount === 1) {
        return {
          id: 'user-1',
          email: 'user1@example.com',
          nome: 'User One',
          senha: 'password123'
        };
      } else {
        return {
          id: 'user-2',
          email: 'user2@example.com',
          nome: 'User Two',
          senha: 'password123'
        };
      }
    };

    const service1 = new LoginService(UserRepository, 'user1@example.com', 'password123');
    const result1 = await service1.execute();

    const service2 = new LoginService(UserRepository, 'user2@example.com', 'password123');
    const result2 = await service2.execute();

    expect(result1.accessToken).not.toBe(result2.accessToken);
  });

  test('should include user id in accessToken payload', async () => {
    UserRepository.prototype.selectOne = async () => ({
      id: 'user-123',
      email: 'test@example.com',
      nome: 'Test User',
      senha: 'password123'
    });

    const service = new LoginService(UserRepository, 'test@example.com', 'password123');
    const result = await service.execute();

    const [, encodedBody] = result.accessToken.split('.');
    const bodyJson = Buffer.from(encodedBody, 'base64').toString('utf8');
    const body = JSON.parse(bodyJson);

    expect(body.sub).toBe('user-123');
  });

  test('should include user email in accessToken payload', async () => {
    UserRepository.prototype.selectOne = async () => ({
      id: 'user-123',
      email: 'test@example.com',
      nome: 'Test User',
      senha: 'password123'
    });

    const service = new LoginService(UserRepository, 'test@example.com', 'password123');
    const result = await service.execute();

    const [, encodedBody] = result.accessToken.split('.');
    const bodyJson = Buffer.from(encodedBody, 'base64').toString('utf8');
    const body = JSON.parse(bodyJson);

    expect(body.email).toBe('test@example.com');
  });

  test('should not include email in refreshToken payload', async () => {
    UserRepository.prototype.selectOne = async () => ({
      id: 'user-123',
      email: 'test@example.com',
      nome: 'Test User',
      senha: 'password123'
    });

    const service = new LoginService(UserRepository, 'test@example.com', 'password123');
    const result = await service.execute();

    const [, encodedBody] = result.refreshToken.split('.');
    const bodyJson = Buffer.from(encodedBody, 'base64').toString('utf8');
    const body = JSON.parse(bodyJson);

    expect(body.sub).toBe('user-123');
    expect(body.email).toBeUndefined();
  });
});
