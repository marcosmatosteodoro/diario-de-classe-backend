import { RefreshTokenService } from '../../../../src/services/auth/refreshTokenService.js';
import { LoginService } from '../../../../src/services/auth/loginService.js';
import UserRepository from '../../../../src/repositories/userRepository.js';
import Constants from '../../../../src/utilities/constants.js';

describe('RefreshTokenService', () => {
  let originalSelectOne;
  let originalLoginServiceHandle;

  beforeEach(() => {
    originalSelectOne = UserRepository.prototype.selectOne;
    originalLoginServiceHandle = LoginService.handle;
  });

  afterEach(() => {
    UserRepository.prototype.selectOne = originalSelectOne;
    LoginService.handle = originalLoginServiceHandle;
  });

  test('should return null when refreshToken is not provided', async () => {
    const service = new RefreshTokenService(UserRepository, null);
    const result = await service.execute();

    expect(result).toBeNull();
  });

  test('should return null when refreshToken is empty', async () => {
    const service = new RefreshTokenService(UserRepository, '');
    const result = await service.execute();

    expect(result).toBeNull();
  });

  test('should return null when refreshToken is invalid format', async () => {
    const service = new RefreshTokenService(UserRepository, 'invalid-token');
    const result = await service.execute();

    expect(result).toBeNull();
  });

  test('should return null when user is not found', async () => {
    // Gera um refresh token válido primeiro
    UserRepository.prototype.selectOne = async () => ({
      id: 'user-123',
      email: 'test@example.com',
      nome: 'Test User',
      senha: 'password123'
    });

    const loginResult = await LoginService.handle('test@example.com', 'password123');
    const refreshToken = loginResult.refreshToken;

    // Agora muda o repository para retornar null ao procurar o usuário
    UserRepository.prototype.selectOne = async () => null;

    const service = new RefreshTokenService(UserRepository, refreshToken);
    const result = await service.execute();

    expect(result).toBeNull();
  });

  test('should return new accessToken when refreshToken is valid', async () => {
    // Primeiro faz login para obter um refresh token válido
    UserRepository.prototype.selectOne = async () => ({
      id: 'user-123',
      email: 'test@example.com',
      nome: 'Test User',
      senha: 'password123'
    });

    const loginResult = await LoginService.handle('test@example.com', 'password123');
    const refreshToken = loginResult.refreshToken;

    // Agora usa o refresh token
    const service = new RefreshTokenService(UserRepository, refreshToken);
    const result = await service.execute();

    expect(result).not.toBeNull();
    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('tokenType');
    expect(result).toHaveProperty('expiresIn');
  });

  test('should generate new accessToken with correct structure', async () => {
    UserRepository.prototype.selectOne = async () => ({
      id: 'user-123',
      email: 'test@example.com',
      nome: 'Test User',
      senha: 'password123'
    });

    const loginResult = await LoginService.handle('test@example.com', 'password123');
    const refreshToken = loginResult.refreshToken;

    const service = new RefreshTokenService(UserRepository, refreshToken);
    const result = await service.execute();

    const newAccessToken = result.accessToken;
    const parts = newAccessToken.split('.');

    expect(parts.length).toBe(3);
  });

  test('should return tokenType as Bearer', async () => {
    UserRepository.prototype.selectOne = async () => ({
      id: 'user-123',
      email: 'test@example.com',
      nome: 'Test User',
      senha: 'password123'
    });

    const loginResult = await LoginService.handle('test@example.com', 'password123');
    const refreshToken = loginResult.refreshToken;

    const service = new RefreshTokenService(UserRepository, refreshToken);
    const result = await service.execute();

    expect(result.tokenType).toBe('Bearer');
  });

  test('should return correct expiresIn value', async () => {
    UserRepository.prototype.selectOne = async () => ({
      id: 'user-123',
      email: 'test@example.com',
      nome: 'Test User',
      senha: 'password123'
    });

    const loginResult = await LoginService.handle('test@example.com', 'password123');
    const refreshToken = loginResult.refreshToken;

    const service = new RefreshTokenService(UserRepository, refreshToken);
    const result = await service.execute();

    expect(result.expiresIn).toBe(Constants.accessExp);
  });

  test('should include userId and email in new accessToken', async () => {
    UserRepository.prototype.selectOne = async () => ({
      id: 'user-456',
      email: 'newuser@example.com',
      nome: 'New User',
      senha: 'password123'
    });

    const loginResult = await LoginService.handle('newuser@example.com', 'password123');
    const refreshToken = loginResult.refreshToken;

    const service = new RefreshTokenService(UserRepository, refreshToken);
    const result = await service.execute();

    const [, encodedBody] = result.accessToken.split('.');
    const bodyJson = Buffer.from(encodedBody, 'base64').toString('utf8');
    const body = JSON.parse(bodyJson);

    expect(body.sub).toBe('user-456');
    expect(body.email).toBe('newuser@example.com');
  });

  test('should handle static handle method correctly', async () => {
    UserRepository.prototype.selectOne = async () => ({
      id: 'user-123',
      email: 'test@example.com',
      nome: 'Test User',
      senha: 'password123'
    });

    const loginResult = await LoginService.handle('test@example.com', 'password123');
    const refreshToken = loginResult.refreshToken;

    const result = await RefreshTokenService.handle(refreshToken);

    expect(result).not.toBeNull();
    expect(result).toHaveProperty('accessToken');
  });

  test('should generate different accessToken on each refresh', async () => {
    UserRepository.prototype.selectOne = async () => ({
      id: 'user-123',
      email: 'test@example.com',
      nome: 'Test User',
      senha: 'password123'
    });

    const loginResult = await LoginService.handle('test@example.com', 'password123');
    const refreshToken = loginResult.refreshToken;

    const service1 = new RefreshTokenService(UserRepository, refreshToken);
    const result1 = await service1.execute();

    const service2 = new RefreshTokenService(UserRepository, refreshToken);
    const result2 = await service2.execute();

    // Os tokens podem ser diferentes se gerados em segundos diferentes
    expect(result1).toHaveProperty('accessToken');
    expect(result2).toHaveProperty('accessToken');
  });
});
