import { jest } from '@jest/globals';
import { LogoutService } from '../../../../src/services/auth/logoutService.js';
import UserRepository from '../../../../src/repositories/userRepository.js';
import tokenRevocationManager from '../../../../src/services/auth/tokenRevocationManagerService.js';

describe('LogoutService', () => {
  beforeEach(() => tokenRevocationManager.clear());
  afterEach(() => {
    jest.restoreAllMocks();
    tokenRevocationManager.clear();
  });

  test.each([null, undefined, ''])('sem token (%p): nada a revogar, sem lançar', async token => {
    const result = await new LogoutService(UserRepository, token).execute();

    expect(result).toEqual({ revogado: false });
    expect(tokenRevocationManager.getCount()).toBe(0);
  });

  test('token ainda não revogado é revogado', async () => {
    const result = await LogoutService.handle('token-a');

    expect(result).toEqual({ revogado: true });
    expect(tokenRevocationManager.isRevoked('token-a')).toBe(true);
  });

  test('token já revogado: sem lançar e sem nova revogação', async () => {
    tokenRevocationManager.revoke('token-b');
    const revoke = jest.spyOn(tokenRevocationManager, 'revoke');

    const result = await LogoutService.handle('token-b');

    expect(result).toEqual({ revogado: false });
    expect(revoke).not.toHaveBeenCalled();
    expect(tokenRevocationManager.getCount()).toBe(1);
  });

  test('tokens diferentes são revogados de forma independente', async () => {
    await LogoutService.handle('token-1');

    expect(tokenRevocationManager.isRevoked('token-1')).toBe(true);
    expect(tokenRevocationManager.isRevoked('token-2')).toBe(false);
  });
});
