import { LogoutService } from '../../../../src/services/auth/logoutService.js';
import UserRepository from '../../../../src/repositories/userRepository.js';
import tokenRevocationManager from '../../../../src/services/auth/tokenRevocationManagerService.js';

describe('LogoutService', () => {
  let originalSelectOne;

  beforeEach(() => {
    originalSelectOne = UserRepository.prototype.selectOne;
    tokenRevocationManager.clear();
  });

  afterEach(() => {
    UserRepository.prototype.selectOne = originalSelectOne;
    tokenRevocationManager.clear();
  });

  test('should return null when refreshToken is not provided', async () => {
    const service = new LogoutService(UserRepository, null);
    const result = await service.execute();

    expect(result).toBeNull();
  });

  test('should return null when refreshToken is empty', async () => {
    const service = new LogoutService(UserRepository, '');
    const result = await service.execute();

    expect(result).toBeNull();
  });

  test('should return success message when refreshToken is valid', async () => {
    const token =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

    const service = new LogoutService(UserRepository, token);
    const result = await service.execute();

    expect(result).not.toBeNull();
    expect(result).toHaveProperty('message');
    expect(result).toHaveProperty('success');
    expect(result.success).toBe(true);
  });

  test('should return auth.logout.success message', async () => {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signature';

    const service = new LogoutService(UserRepository, token);
    const result = await service.execute();

    expect(result.message).toBe('auth.logout.success');
  });

  test('should revoke token after logout', async () => {
    const token = 'test-refresh-token-123';

    const service = new LogoutService(UserRepository, token);
    await service.execute();

    expect(tokenRevocationManager.isRevoked(token)).toBe(true);
  });

  test('should not accept revoked token', async () => {
    const token = 'revoked-token-456';

    // Primeiro logout revoga o token
    const service1 = new LogoutService(UserRepository, token);
    await service1.execute();

    // Segundo logout com mesmo token
    const service2 = new LogoutService(UserRepository, token);
    const result = await service2.execute();

    expect(result).toBeNull();
  });

  test('should handle static handle method correctly', async () => {
    const token = 'test-token-789';

    const result = await LogoutService.handle(token);

    expect(result).not.toBeNull();
    expect(result.success).toBe(true);
  });

  test('should revoke different tokens independently', async () => {
    const token1 = 'token-one';
    const token2 = 'token-two';

    const service1 = new LogoutService(UserRepository, token1);
    await service1.execute();

    expect(tokenRevocationManager.isRevoked(token1)).toBe(true);
    expect(tokenRevocationManager.isRevoked(token2)).toBe(false);
  });

  test('should handle multiple logouts with same token', async () => {
    const token = 'test-multi-logout';

    const service1 = new LogoutService(UserRepository, token);
    const result1 = await service1.execute();

    expect(result1.success).toBe(true);
    expect(tokenRevocationManager.isRevoked(token)).toBe(true);

    // Tentar fazer logout novamente com token já revogado
    const service2 = new LogoutService(UserRepository, token);
    const result2 = await service2.execute();

    expect(result2).toBeNull();
  });

  test('should track revoked tokens correctly', async () => {
    const tokens = ['token-a', 'token-b', 'token-c'];

    for (const token of tokens) {
      const service = new LogoutService(UserRepository, token);
      await service.execute();
    }

    expect(tokenRevocationManager.isRevoked('token-a')).toBe(true);
    expect(tokenRevocationManager.isRevoked('token-b')).toBe(true);
    expect(tokenRevocationManager.isRevoked('token-c')).toBe(true);
    expect(tokenRevocationManager.isRevoked('token-not-revoked')).toBe(false);
  });
});
