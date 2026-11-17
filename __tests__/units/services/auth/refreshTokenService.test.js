import { jest } from '@jest/globals';
import { RefreshTokenService } from '../../../../src/services/auth/refreshTokenService.js';
import { GetConfiguracaoService } from '../../../../src/services/configuracao/getConfiguracaoService.js';
import UserRepository from '../../../../src/repositories/userRepository.js';
import tokenRevocationManager from '../../../../src/services/auth/tokenRevocationManagerService.js';
import { createJwt } from '../../../../src/utilities/createJwt.js';
import Constants from '../../../../src/utilities/constants.js';
import { base64url } from '../../../../src/utilities/base64url.js';

const makeRefreshToken = sub =>
  createJwt({ sub }, Constants.jwtRefreshSecret, Constants.refreshExp);

const decodificar = jwt => JSON.parse(Buffer.from(jwt.split('.')[1], 'base64').toString('utf8'));

const USUARIO = {
  id: 'user-123',
  email: 'test@example.com',
  nome: 'Test User',
  permissao: 'ADMIN'
};

describe('RefreshTokenService', () => {
  let selectOne;
  let configuracoes;

  beforeEach(() => {
    tokenRevocationManager.clear();
    selectOne = jest.spyOn(UserRepository.prototype, 'selectOne').mockResolvedValue({ ...USUARIO });
    configuracoes = jest.spyOn(GetConfiguracaoService, 'handle').mockResolvedValue([{ id: 'c1' }]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    tokenRevocationManager.clear();
  });

  const executar = token => new RefreshTokenService(UserRepository, token).execute();

  describe('recusas', () => {
    test.each([null, undefined, ''])(
      'sem token (%p) devolve null sem consultar o usuário',
      async t => {
        expect(await executar(t)).toBeNull();
        expect(selectOne).not.toHaveBeenCalled();
      }
    );

    test('token revogado devolve null antes de verificar assinatura e usuário', async () => {
      const token = makeRefreshToken('user-123');
      tokenRevocationManager.revoke(token);

      expect(await executar(token)).toBeNull();
      expect(selectOne).not.toHaveBeenCalled();
    });

    test('formato inválido devolve null', async () => {
      expect(await executar('invalid-token')).toBeNull();
      expect(selectOne).not.toHaveBeenCalled();
    });

    test('assinatura arbitrária devolve null sem consultar o usuário', async () => {
      const exp = Math.floor(Date.now() / 1000) + 3600;
      const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const body = base64url(JSON.stringify({ sub: 'user-123', exp }));

      expect(await executar(`${header}.${body}.assinatura-forjada`)).toBeNull();
      expect(selectOne).not.toHaveBeenCalled();
    });

    test('segredo errado devolve null', async () => {
      const token = createJwt({ sub: 'user-123' }, Constants.jwtSecret, Constants.refreshExp);

      expect(await executar(token)).toBeNull();
      expect(selectOne).not.toHaveBeenCalled();
    });

    test('payload adulterado depois de assinado devolve null', async () => {
      const [h, , s] = makeRefreshToken('user-123').split('.');
      const body = base64url(
        JSON.stringify({ sub: 'outro', exp: Math.floor(Date.now() / 1000) + 3600 })
      );

      expect(await executar(`${h}.${body}.${s}`)).toBeNull();
      expect(selectOne).not.toHaveBeenCalled();
    });

    test('token vencido devolve null', async () => {
      const token = createJwt({ sub: 'user-123' }, Constants.jwtRefreshSecret, -10);

      expect(await executar(token)).toBeNull();
      expect(selectOne).not.toHaveBeenCalled();
    });

    test('usuário removido devolve null', async () => {
      selectOne.mockResolvedValue(null);

      expect(await executar(makeRefreshToken('user-123'))).toBeNull();
    });
  });

  describe('usuarioPodeRenovar', () => {
    const service = () => new RefreshTokenService(UserRepository, 'x');

    test('é false para usuário ausente e true para usuário existente', () => {
      expect(service().usuarioPodeRenovar(null)).toBe(false);
      expect(service().usuarioPodeRenovar({ id: 'u1' })).toBe(true);
    });

    test('o execute consulta o gancho e respeita a recusa dele', async () => {
      const gancho = jest
        .spyOn(RefreshTokenService.prototype, 'usuarioPodeRenovar')
        .mockReturnValue(false);

      expect(await executar(makeRefreshToken('user-123'))).toBeNull();
      expect(gancho).toHaveBeenCalledWith(expect.objectContaining({ id: 'user-123' }));
    });
  });

  describe('renovação válida', () => {
    test('lê o usuário por id com a projeção do repositório (senha fora)', async () => {
      await executar(makeRefreshToken('user-123'));

      expect(selectOne).toHaveBeenCalledTimes(1);
      expect(selectOne).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        select: new UserRepository().selectFields
      });
      expect(new UserRepository().selectFields.senha).toBe(false);
    });

    test('devolve accessToken, tokenType, expiresIn, user e configuracao', async () => {
      const result = await executar(makeRefreshToken('user-123'));

      expect(result).toEqual({
        accessToken: expect.any(String),
        tokenType: 'Bearer',
        expiresIn: Constants.accessExp,
        user: USUARIO,
        configuracao: { id: 'c1' }
      });
      expect(configuracoes).toHaveBeenCalledTimes(1);
    });

    test('o access nasce por generatePayload, com a versão do claim ver', async () => {
      const { accessToken } = await executar(makeRefreshToken('user-123'));
      const claims = decodificar(accessToken);

      expect(claims).toMatchObject({
        sub: 'user-123',
        id: 'user-123',
        email: 'test@example.com',
        role: 'ADMIN',
        ver: Constants.accessTokenVersion
      });
    });

    test('sem configuração, configuracao é null', async () => {
      configuracoes.mockResolvedValue([]);

      const result = await executar(makeRefreshToken('user-123'));

      expect(result.configuracao).toBeNull();
    });

    test('static handle devolve o mesmo contrato', async () => {
      const result = await RefreshTokenService.handle(makeRefreshToken('user-123'));

      expect(result).toHaveProperty('accessToken');
      expect(result.user.id).toBe('user-123');
    });
  });
});
