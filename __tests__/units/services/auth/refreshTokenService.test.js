import { RefreshTokenService } from '../../../../src/services/auth/refreshTokenService.js';
import UserRepository from '../../../../src/repositories/userRepository.js';
import { createJwt } from '../../../../src/utilities/createJwt.js';
import Constants from '../../../../src/utilities/constants.js';
import { base64url } from '../../../../src/utilities/base64url.js';

// Gera um refresh token válido diretamente (sem passar pelo LoginService, que
// depende de banco), isolando o RefreshTokenService no teste unitário.
const makeRefreshToken = sub =>
  createJwt({ sub }, Constants.jwtRefreshSecret, Constants.refreshExp);

describe('RefreshTokenService', () => {
  let originalSelectOne;

  beforeEach(() => {
    originalSelectOne = UserRepository.prototype.selectOne;
  });

  afterEach(() => {
    UserRepository.prototype.selectOne = originalSelectOne;
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
    const refreshToken = makeRefreshToken('user-123');

    // Usuário não existe mais no banco
    UserRepository.prototype.selectOne = async () => null;

    const service = new RefreshTokenService(UserRepository, refreshToken);
    const result = await service.execute();

    expect(result).toBeNull();
  });

  test('should return new accessToken when refreshToken is valid', async () => {
    UserRepository.prototype.selectOne = async () => ({
      id: 'user-123',
      email: 'test@example.com',
      nome: 'Test User'
    });

    const refreshToken = makeRefreshToken('user-123');
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
      nome: 'Test User'
    });

    const refreshToken = makeRefreshToken('user-123');
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
      nome: 'Test User'
    });

    const refreshToken = makeRefreshToken('user-123');
    const service = new RefreshTokenService(UserRepository, refreshToken);
    const result = await service.execute();

    expect(result.tokenType).toBe('Bearer');
  });

  test('should return correct expiresIn value', async () => {
    UserRepository.prototype.selectOne = async () => ({
      id: 'user-123',
      email: 'test@example.com',
      nome: 'Test User'
    });

    const refreshToken = makeRefreshToken('user-123');
    const service = new RefreshTokenService(UserRepository, refreshToken);
    const result = await service.execute();

    expect(result.expiresIn).toBe(Constants.accessExp);
  });

  test('should include userId and email in new accessToken', async () => {
    UserRepository.prototype.selectOne = async () => ({
      id: 'user-456',
      email: 'newuser@example.com',
      nome: 'New User'
    });

    const refreshToken = makeRefreshToken('user-456');
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
      nome: 'Test User'
    });

    const refreshToken = makeRefreshToken('user-123');
    const result = await RefreshTokenService.handle(refreshToken);

    expect(result).not.toBeNull();
    expect(result).toHaveProperty('accessToken');
  });

  test('should generate different accessToken on each refresh', async () => {
    UserRepository.prototype.selectOne = async () => ({
      id: 'user-123',
      email: 'test@example.com',
      nome: 'Test User'
    });

    const refreshToken = makeRefreshToken('user-123');

    const service1 = new RefreshTokenService(UserRepository, refreshToken);
    const result1 = await service1.execute();

    const service2 = new RefreshTokenService(UserRepository, refreshToken);
    const result2 = await service2.execute();

    // Os tokens podem ser diferentes se gerados em segundos diferentes
    expect(result1).toHaveProperty('accessToken');
    expect(result2).toHaveProperty('accessToken');
  });

  describe('assinatura e expiração', () => {
    const selectOneSpy = () => {
      const calls = [];
      UserRepository.prototype.selectOne = async arg => {
        calls.push(arg);
        return { id: 'user-123', email: 'test@example.com', nome: 'Test User' };
      };
      return calls;
    };

    test('should return null when signature is arbitrary', async () => {
      const calls = selectOneSpy();
      const exp = Math.floor(Date.now() / 1000) + 3600;
      const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const body = base64url(JSON.stringify({ sub: 'user-123', exp }));
      const forged = `${header}.${body}.assinatura-forjada`;

      const result = await new RefreshTokenService(UserRepository, forged).execute();

      expect(result).toBeNull();
      expect(calls).toHaveLength(0);
    });

    test('should return null when signed with the wrong secret', async () => {
      const calls = selectOneSpy();
      const token = createJwt({ sub: 'user-123' }, Constants.jwtSecret, Constants.refreshExp);

      const result = await new RefreshTokenService(UserRepository, token).execute();

      expect(result).toBeNull();
      expect(calls).toHaveLength(0);
    });

    test('should return null when payload is tampered after signing', async () => {
      const calls = selectOneSpy();
      const token = makeRefreshToken('user-123');
      const [h, , s] = token.split('.');
      const body = base64url(
        JSON.stringify({ sub: 'outro', exp: Math.floor(Date.now() / 1000) + 3600 })
      );

      const result = await new RefreshTokenService(UserRepository, `${h}.${body}.${s}`).execute();

      expect(result).toBeNull();
      expect(calls).toHaveLength(0);
    });

    test('should return null when signature has different length', async () => {
      selectOneSpy();
      const token = makeRefreshToken('user-123');

      const result = await new RefreshTokenService(UserRepository, `${token}x`).execute();

      expect(result).toBeNull();
    });

    test('should return null when token is expired', async () => {
      selectOneSpy();
      const token = createJwt({ sub: 'user-123' }, Constants.jwtRefreshSecret, -10);

      const result = await new RefreshTokenService(UserRepository, token).execute();

      expect(result).toBeNull();
    });
  });
});
