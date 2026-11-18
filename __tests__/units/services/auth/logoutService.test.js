import { jest } from '@jest/globals';
import { LogoutService } from '../../../../src/services/auth/logoutService.js';
import SessaoLoginRepository from '../../../../src/repositories/sessaoLoginRepository.js';
import { createJwt } from '../../../../src/utilities/createJwt.js';
import Constants from '../../../../src/utilities/constants.js';

const SID = 'sid-1';

// Refresh válido base; cada variante troca um único campo dele.
const refresh = ({
  claims = {},
  segredo = Constants.jwtRefreshSecret,
  exp = Constants.refreshExp
} = {}) =>
  createJwt(
    { sub: 'u1', typ: Constants.refreshTokenType, sid: SID, jti: 'jti-1', ...claims },
    segredo,
    exp
  );

describe('LogoutService', () => {
  let encerrar;

  beforeEach(() => {
    // Assinatura declarada: SessaoLoginRepository#encerrar(sid, motivo) -> Promise<boolean>
    encerrar = jest.spyOn(SessaoLoginRepository.prototype, 'encerrar').mockResolvedValue(true);
  });

  afterEach(() => jest.restoreAllMocks());

  test('cookie válido: encerra pelo sid com o motivo sair e devolve revogado true', async () => {
    const result = await LogoutService.handle(refresh());

    expect(encerrar).toHaveBeenCalledTimes(1);
    expect(encerrar).toHaveBeenCalledWith(SID, 'sair');
    expect(result).toEqual({ revogado: true });
  });

  test('sessão já encerrada (ou saída repetida): revogado false, sem lançar', async () => {
    encerrar.mockResolvedValue(false);

    const result = await LogoutService.handle(refresh());

    expect(encerrar).toHaveBeenCalledTimes(1);
    expect(encerrar).toHaveBeenCalledWith(SID, 'sair');
    expect(result).toEqual({ revogado: false });
  });

  test.each(['jti-velho', 'jti-qualquer-outro', undefined])(
    'o jti do cookie (%p) é ignorado: mesmo encerramento e mesmo resultado',
    async jti => {
      const result = await LogoutService.handle(refresh({ claims: { jti } }));

      expect(encerrar).toHaveBeenCalledTimes(1);
      expect(encerrar).toHaveBeenCalledWith(SID, 'sair');
      expect(result).toEqual({ revogado: true });
    }
  );

  test('contrato: resolve exatamente { revogado } (única chave booleana)', async () => {
    const result = await LogoutService.handle(refresh());

    expect(Object.keys(result)).toEqual(['revogado']);
    expect(typeof result.revogado).toBe('boolean');
  });

  describe('sem sessão a encerrar: no-op', () => {
    test.each([
      ['sem cookie', () => null],
      ['valor não-JWT de 12 KB', () => 'x'.repeat(12 * 1024)],
      ['assinatura errada', () => refresh({ segredo: 'outro-segredo-qualquer' })],
      ['vencido', () => refresh({ exp: -10 })],
      ['sem typ (refresh legado)', () => refresh({ claims: { typ: undefined } })],
      ['sem sid', () => refresh({ claims: { sid: undefined } })]
    ])('%s: revogado false, sem lançar e sem encerrar', async (_nome, gerar) => {
      const result = await LogoutService.handle(gerar());

      expect(result).toEqual({ revogado: false });
      expect(encerrar).not.toHaveBeenCalled();
    });

    test('controle positivo: o refresh válido base chama encerrar exatamente 1 vez', async () => {
      await LogoutService.handle(refresh());

      expect(encerrar).toHaveBeenCalledTimes(1);
    });
  });
});
