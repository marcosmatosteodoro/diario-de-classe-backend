import tokenRevocationManager from '../../../../src/services/auth/tokenRevocationManagerService.js';

describe('TokenRevocationManager', () => {
  beforeEach(() => {
    tokenRevocationManager.clear();
  });

  test('should revoke a token', () => {
    const token = 'test-token-123';

    tokenRevocationManager.revoke(token);

    expect(tokenRevocationManager.isRevoked(token)).toBe(true);
  });

  test('should not mark non-revoked token as revoked', () => {
    const token = 'test-token-456';

    expect(tokenRevocationManager.isRevoked(token)).toBe(false);
  });

  test('should revoke multiple tokens independently', () => {
    const token1 = 'token-one';
    const token2 = 'token-two';
    const token3 = 'token-three';

    tokenRevocationManager.revoke(token1);
    tokenRevocationManager.revoke(token2);

    expect(tokenRevocationManager.isRevoked(token1)).toBe(true);
    expect(tokenRevocationManager.isRevoked(token2)).toBe(true);
    expect(tokenRevocationManager.isRevoked(token3)).toBe(false);
  });

  test('should return correct count of revoked tokens', () => {
    expect(tokenRevocationManager.getCount()).toBe(0);

    tokenRevocationManager.revoke('token-1');
    expect(tokenRevocationManager.getCount()).toBe(1);

    tokenRevocationManager.revoke('token-2');
    expect(tokenRevocationManager.getCount()).toBe(2);

    tokenRevocationManager.revoke('token-3');
    expect(tokenRevocationManager.getCount()).toBe(3);
  });

  test('should clear all revoked tokens', () => {
    tokenRevocationManager.revoke('token-1');
    tokenRevocationManager.revoke('token-2');
    tokenRevocationManager.revoke('token-3');

    expect(tokenRevocationManager.getCount()).toBe(3);

    tokenRevocationManager.clear();

    expect(tokenRevocationManager.getCount()).toBe(0);
    expect(tokenRevocationManager.isRevoked('token-1')).toBe(false);
    expect(tokenRevocationManager.isRevoked('token-2')).toBe(false);
    expect(tokenRevocationManager.isRevoked('token-3')).toBe(false);
  });

  test('should not allow duplicate revocations', () => {
    const token = 'test-token';

    tokenRevocationManager.revoke(token);
    tokenRevocationManager.revoke(token);
    tokenRevocationManager.revoke(token);

    expect(tokenRevocationManager.getCount()).toBe(1);
    expect(tokenRevocationManager.isRevoked(token)).toBe(true);
  });

  test('should handle long tokens', () => {
    const longToken =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

    tokenRevocationManager.revoke(longToken);

    expect(tokenRevocationManager.isRevoked(longToken)).toBe(true);
  });

  test('should handle empty string token', () => {
    const emptyToken = '';

    tokenRevocationManager.revoke(emptyToken);

    expect(tokenRevocationManager.isRevoked(emptyToken)).toBe(true);
    expect(tokenRevocationManager.getCount()).toBe(1);
  });

  test('should track revoked tokens across multiple operations', () => {
    const tokens = ['token-a', 'token-b', 'token-c', 'token-d', 'token-e'];

    tokens.forEach(token => tokenRevocationManager.revoke(token));

    expect(tokenRevocationManager.getCount()).toBe(5);

    tokens.forEach(token => {
      expect(tokenRevocationManager.isRevoked(token)).toBe(true);
    });

    expect(tokenRevocationManager.isRevoked('token-not-revoked')).toBe(false);
  });

  test('should maintain state after multiple checks', () => {
    const token = 'persistent-token';

    tokenRevocationManager.revoke(token);

    expect(tokenRevocationManager.isRevoked(token)).toBe(true);
    expect(tokenRevocationManager.isRevoked(token)).toBe(true);
    expect(tokenRevocationManager.isRevoked(token)).toBe(true);

    expect(tokenRevocationManager.getCount()).toBe(1);
  });
});
