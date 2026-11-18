import { jest } from '@jest/globals';
import { LogoutService } from '../../../../src/services/auth/logoutService.js';
import UserRepository from '../../../../src/repositories/userRepository.js';
import { createJwt } from '../../../../src/utilities/createJwt.js';
import Constants from '../../../../src/utilities/constants.js';
import tokenRevocationManager from '../../../../src/services/auth/tokenRevocationManagerService.js';

const refresh = sub =>
  createJwt({ sub, typ: Constants.refreshTokenType }, Constants.jwtRefreshSecret, 60);

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
    const token = refresh('a');
    const result = await LogoutService.handle(token);

    expect(result).toEqual({ revogado: true });
    expect(tokenRevocationManager.isRevoked(token)).toBe(true);
  });

  test.each(['token-qualquer', 'x'.repeat(5000)])(
    'valor que não é refresh válido não é gravado (%#)',
    async valor => {
      expect(await LogoutService.handle(valor)).toEqual({ revogado: false });
      expect(tokenRevocationManager.getCount()).toBe(0);
    }
  );

  test('token já revogado: sem lançar e sem nova revogação', async () => {
    const token = refresh('b');
    tokenRevocationManager.revoke(token);
    const revoke = jest.spyOn(tokenRevocationManager, 'revoke');

    const result = await LogoutService.handle(token);

    expect(result).toEqual({ revogado: false });
    expect(revoke).not.toHaveBeenCalled();
    expect(tokenRevocationManager.getCount()).toBe(1);
  });

  test('tokens diferentes são revogados de forma independente', async () => {
    const [t1, t2] = [refresh('1'), refresh('2')];
    await LogoutService.handle(t1);

    expect(tokenRevocationManager.isRevoked(t1)).toBe(true);
    expect(tokenRevocationManager.isRevoked(t2)).toBe(false);
  });
});
