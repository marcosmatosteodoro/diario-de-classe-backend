import { jest } from '@jest/globals';
import { CUSTO_BARATO, passwordCustoBarato } from '../../../mocks/passwordCustoBarato.js';
import util from 'node:util';
import UserRepository from '../../../../src/repositories/userRepository.js';
import Constants from '../../../../src/utilities/constants.js';
import { parseJwt } from '../../../../src/utilities/verifyJwt.js';
import { GetConfiguracaoService } from '../../../../src/services/configuracao/getConfiguracaoService.js';

// O custo de produção é provado em password.test.js; aqui a regravação do legado
// (hashSenha sem params) usa custo barato. SCRYPT_PARAMS segue o de produção: o hash
// fictício é gerado com ele e o teste compara os parâmetros gravados com a constante real.
// Contador manual: a config do Jest reseta a implementação de jest.fn entre testes.
const passwordReal = await import('../../../../src/utilities/password.js');
const verificacoes = [];
jest.unstable_mockModule('../../../../src/utilities/password.js', () => ({
  ...passwordCustoBarato(passwordReal),
  SCRYPT_PARAMS: passwordReal.SCRYPT_PARAMS,
  hashSenha: (senha, params = CUSTO_BARATO) => passwordReal.hashSenha(senha, params),
  verificarSenha: (senha, gravada) => {
    verificacoes.push({ senha, gravada });
    return passwordReal.verificarSenha(senha, gravada);
  }
}));
const { hashSenha, isHash } = await import('../../../../src/utilities/password.js');
const { LoginService } = await import('../../../../src/services/auth/loginService.js');

let SENHA_HASH;

beforeAll(async () => {
  SENHA_HASH = await hashSenha('password123');
});

describe('LoginService', () => {
  let originalSelectOne;
  let originalGetConfiguracaoHandle;

  beforeEach(() => {
    originalSelectOne = UserRepository.prototype.selectOne;
    originalGetConfiguracaoHandle = GetConfiguracaoService.handle;

    // Mock padrão para configuração
    GetConfiguracaoService.handle = async () => [
      {
        id: 'config-1',
        anoLetivoAtual: '2024',
        periodoAtual: 1
      }
    ];
  });

  afterEach(() => {
    UserRepository.prototype.selectOne = originalSelectOne;
    GetConfiguracaoService.handle = originalGetConfiguracaoHandle;
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
      senha: SENHA_HASH
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
      senha: SENHA_HASH
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
      senha: SENHA_HASH
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
      senha: SENHA_HASH
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
        senha: SENHA_HASH
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
      senha: SENHA_HASH
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
          senha: SENHA_HASH
        };
      } else {
        return {
          id: 'user-2',
          email: 'user2@example.com',
          nome: 'User Two',
          senha: SENHA_HASH
        };
      }
    };

    const service1 = new LoginService(UserRepository, 'user1@example.com', 'password123');
    const result1 = await service1.execute();

    const service2 = new LoginService(UserRepository, 'user2@example.com', 'password123');
    const result2 = await service2.execute();

    expect(result1.accessToken).not.toBe(result2.accessToken);
  });

  test('o access emitido vive accessExp segundos e carrega a claim ver', async () => {
    UserRepository.prototype.selectOne = async () => ({
      id: 'user-123',
      email: 'test@example.com',
      nome: 'Test User',
      senha: SENHA_HASH
    });

    const result = await new LoginService(
      UserRepository,
      'test@example.com',
      'password123'
    ).execute();
    const { payload } = parseJwt(result.accessToken);

    expect(payload.exp - payload.iat).toBe(Constants.accessExp);
    expect(payload.ver).toBe(Constants.accessTokenVersion);
  });

  test('should include user id in accessToken payload', async () => {
    UserRepository.prototype.selectOne = async () => ({
      id: 'user-123',
      email: 'test@example.com',
      nome: 'Test User',
      senha: SENHA_HASH
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
      senha: SENHA_HASH
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
      senha: SENHA_HASH
    });

    const service = new LoginService(UserRepository, 'test@example.com', 'password123');
    const result = await service.execute();

    const [, encodedBody] = result.refreshToken.split('.');
    const bodyJson = Buffer.from(encodedBody, 'base64').toString('utf8');
    const body = JSON.parse(bodyJson);

    expect(body.sub).toBe('user-123');
    expect(body.email).toBeUndefined();
  });

  test('should return user data in response', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      nome: 'Test User',
      senha: SENHA_HASH
    };

    UserRepository.prototype.selectOne = async () => mockUser;

    const service = new LoginService(UserRepository, 'test@example.com', 'password123');
    const result = await service.execute();

    expect(result.user).toEqual(mockUser);
  });

  test('should return configuracao data in response', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      nome: 'Test User',
      senha: SENHA_HASH
    };

    const mockConfiguracao = {
      id: 'config-1',
      anoLetivoAtual: '2024',
      periodoAtual: 1
    };

    UserRepository.prototype.selectOne = async () => mockUser;
    GetConfiguracaoService.handle = async () => [mockConfiguracao];

    const service = new LoginService(UserRepository, 'test@example.com', 'password123');
    const result = await service.execute();

    expect(result.configuracao).toEqual(mockConfiguracao);
  });

  test('should call GetConfiguracaoService.handle when user is authenticated', async () => {
    let called = false;
    UserRepository.prototype.selectOne = async () => ({
      id: 'user-123',
      email: 'test@example.com',
      nome: 'Test User',
      senha: SENHA_HASH
    });

    GetConfiguracaoService.handle = async () => {
      called = true;
      return [
        {
          id: 'config-1',
          anoLetivoAtual: '2024',
          periodoAtual: 1
        }
      ];
    };

    const service = new LoginService(UserRepository, 'test@example.com', 'password123');
    await service.execute();

    expect(called).toBe(true);
  });

  test('should return 204 when configuracao is null', async () => {
    UserRepository.prototype.selectOne = async () => ({
      id: 'user-123',
      email: 'test@example.com',
      nome: 'Test User',
      senha: SENHA_HASH
    });

    GetConfiguracaoService.handle = async () => null;

    const service = new LoginService(UserRepository, 'test@example.com', 'password123');

    let statusCode = null;
    let jsonCalled = false;

    service.res = {
      status: function (code) {
        statusCode = code;
        return this;
      },
      json: function () {
        jsonCalled = true;
        return this;
      }
    };

    await service.execute();

    expect(statusCode).toBe(204);
    expect(jsonCalled).toBe(true);
  });

  test('should return 204 when configuracao is empty array', async () => {
    UserRepository.prototype.selectOne = async () => ({
      id: 'user-123',
      email: 'test@example.com',
      nome: 'Test User',
      senha: SENHA_HASH
    });

    GetConfiguracaoService.handle = async () => [];

    const service = new LoginService(UserRepository, 'test@example.com', 'password123');

    let statusCode = null;
    let jsonCalled = false;

    service.res = {
      status: function (code) {
        statusCode = code;
        return this;
      },
      json: function () {
        jsonCalled = true;
        return this;
      }
    };

    await service.execute();

    expect(statusCode).toBe(204);
    expect(jsonCalled).toBe(true);
  });

  test('should return first configuracao when multiple exist', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      nome: 'Test User',
      senha: SENHA_HASH
    };

    const mockConfiguracoes = [
      {
        id: 'config-1',
        anoLetivoAtual: '2024',
        periodoAtual: 1
      },
      {
        id: 'config-2',
        anoLetivoAtual: '2025',
        periodoAtual: 2
      }
    ];

    UserRepository.prototype.selectOne = async () => mockUser;
    GetConfiguracaoService.handle = async () => mockConfiguracoes;

    const service = new LoginService(UserRepository, 'test@example.com', 'password123');
    const result = await service.execute();

    expect(result.configuracao).toEqual(mockConfiguracoes[0]);
  });

  describe('senha gravada: hash, legado em texto puro e fail secure', () => {
    let originalUpdate;
    let errorSpy;

    beforeEach(() => {
      originalUpdate = UserRepository.prototype.update;
      errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      UserRepository.prototype.update = originalUpdate;
      errorSpy.mockRestore();
    });

    const capturado = () =>
      errorSpy.mock.calls
        .flat()
        .map(a => util.inspect(a, { depth: null }))
        .join(' ');

    test('hash gravado + senha correta autentica, devolve tokens e não regrava', async () => {
      const updates = [];
      UserRepository.prototype.selectOne = async () => ({ id: 'u1', senha: SENHA_HASH });
      UserRepository.prototype.update = async (...args) => updates.push(args);

      const result = await LoginService.handle('a@example.com', 'password123');

      expect(result.accessToken.split('.')).toHaveLength(3);
      expect(result.refreshToken.split('.')).toHaveLength(3);
      expect(result.user).not.toHaveProperty('senha');
      expect(updates).toHaveLength(0);
    });

    test('hash gravado + senha errada devolve null', async () => {
      UserRepository.prototype.selectOne = async () => ({ id: 'u1', senha: SENHA_HASH });

      expect(await LoginService.handle('a@example.com', 'errada')).toBeNull();
    });

    test('hash gravado não aceita o próprio hash como senha (pass-the-hash)', async () => {
      UserRepository.prototype.selectOne = async () => ({ id: 'u1', senha: SENHA_HASH });

      expect(await LoginService.handle('a@example.com', SENHA_HASH)).toBeNull();
    });

    test('legado em texto puro correto autentica e regrava hash da senha informada', async () => {
      const updates = [];
      UserRepository.prototype.selectOne = async () => ({ id: 'u-legado', senha: 'legada-123' });
      UserRepository.prototype.update = async (where, data, options) => {
        updates.push({ where, data, options });
      };

      const result = await LoginService.handle('a@example.com', 'legada-123');

      expect(result.accessToken).toEqual(expect.any(String));
      expect(result.user).not.toHaveProperty('senha');
      expect(updates).toHaveLength(1);
      expect(updates[0].where).toEqual({ id: 'u-legado' });
      expect(Object.keys(updates[0].data)).toEqual(['senha']);
      expect(updates[0].data.senha).not.toBe('legada-123');
      expect(isHash(updates[0].data.senha)).toBe(true);
      expect(updates[0].options).toEqual({ select: { id: true } });
    });

    test('legado em texto puro com senha errada devolve null e não regrava', async () => {
      const updates = [];
      UserRepository.prototype.selectOne = async () => ({ id: 'u-legado', senha: 'legada-123' });
      UserRepository.prototype.update = async (...args) => updates.push(args);

      expect(await LoginService.handle('a@example.com', 'legada-124')).toBeNull();
      expect(await LoginService.handle('a@example.com', 'legada-1234')).toBeNull();
      expect(updates).toHaveLength(0);
    });

    test('falha na regravação não derruba o login e o log não contém senha nem hash', async () => {
      const SENTINELA = 'sentinela-senha-legada-xyz';
      UserRepository.prototype.selectOne = async () => ({ id: 'u-legado', senha: SENTINELA });
      UserRepository.prototype.update = async () => {
        const erro = new Error(
          `Invalid prisma.user.update() invocation: data: { senha: "${SENTINELA}" }`
        );
        erro.name = 'PrismaClientValidationError';
        erro.code = 'P2000';
        throw erro;
      };

      const result = await LoginService.handle('a@example.com', SENTINELA);

      expect(result.accessToken).toEqual(expect.any(String));
      expect(errorSpy).toHaveBeenCalled();
      expect(capturado()).toContain('P2000');
      expect(capturado()).not.toContain(SENTINELA);
      expect(capturado()).not.toContain('scrypt$');
    });

    test('exceção na verificação nega o login (fail secure)', async () => {
      UserRepository.prototype.selectOne = async () => ({
        id: 'u1',
        senha: 'scrypt$131072$8$1$c2FsdA==$aGFzaA=='
      });
      const spy = jest.spyOn(Buffer, 'from').mockImplementation(() => {
        throw new Error('falha simulada');
      });

      try {
        expect(await LoginService.handle('a@example.com', 'password123')).toBeNull();
      } finally {
        spy.mockRestore();
      }
    });

    test('senha gravada nula ou não-string nega o login', async () => {
      UserRepository.prototype.selectOne = async () => ({ id: 'u1', senha: null });

      expect(await LoginService.handle('a@example.com', 'password123')).toBeNull();
    });

    describe('custo igualado nos caminhos de falha (hash ficticio)', () => {
      let ficticio;

      beforeEach(() => {
        ficticio = jest.spyOn(LoginService.prototype, 'verificarContraHashFicticio');
      });

      test('e-mail inexistente paga a derivação 1 vez', async () => {
        UserRepository.prototype.selectOne = async () => null;

        expect(await LoginService.handle('x@example.com', 'password123')).toBeNull();
        expect(ficticio).toHaveBeenCalledTimes(1);
      });

      test('senha gravada nula paga a derivação 1 vez', async () => {
        UserRepository.prototype.selectOne = async () => ({ id: 'u1', senha: null });

        expect(await LoginService.handle('a@example.com', 'password123')).toBeNull();
        expect(ficticio).toHaveBeenCalledTimes(1);
      });

      test('legado em texto puro errado paga a derivação 1 vez', async () => {
        UserRepository.prototype.selectOne = async () => ({ id: 'u1', senha: 'legada-123' });

        expect(await LoginService.handle('a@example.com', 'errada')).toBeNull();
        expect(ficticio).toHaveBeenCalledTimes(1);
      });

      test('hash correto não paga a derivação extra', async () => {
        UserRepository.prototype.selectOne = async () => ({ id: 'u1', senha: SENHA_HASH });

        expect(await LoginService.handle('a@example.com', 'password123')).not.toBeNull();
        expect(ficticio).not.toHaveBeenCalled();
      });

      describe('a verificação contra o hash fictício é observável na fronteira', () => {
        const { N, r, p } = passwordReal.SCRYPT_PARAMS;

        beforeEach(() => {
          verificacoes.length = 0;
        });

        test.each([
          ['e-mail inexistente', null, 'password123'],
          ['senha gravada nula', { id: 'u1', senha: null }, 'password123'],
          ['legado em texto puro errado', { id: 'u1', senha: 'legada-123' }, 'errada']
        ])('%s: 1 verificação, hash válido com o custo de produção', async (_, user, senha) => {
          UserRepository.prototype.selectOne = async () => user;

          expect(await LoginService.handle('a@example.com', senha)).toBeNull();

          expect(verificacoes).toHaveLength(1);
          expect(verificacoes[0].senha).toBe(senha);
          expect(isHash(verificacoes[0].gravada)).toBe(true);
          expect(verificacoes[0].gravada.split('$').slice(1, 4)).toEqual([N, r, p].map(String));
        });
      });
    });
  });
});
