import { jest } from '@jest/globals';
import { CUSTO_BARATO, passwordCustoBarato } from '../../../mocks/passwordCustoBarato.js';
import util from 'node:util';
import UserRepository from '../../../../src/repositories/userRepository.js';
import Constants from '../../../../src/utilities/constants.js';
import { parseJwt } from '../../../../src/utilities/verifyJwt.js';
import { GetConfiguracaoService } from '../../../../src/services/configuracao/getConfiguracaoService.js';
import SessaoLoginRepository from '../../../../src/repositories/sessaoLoginRepository.js';
import ServiceUnavailableError from '../../../../src/utilities/errors/serviceUnavailable.js';
import { capturarLog } from '../../../mocks/capturaDeLog.js';

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

// `ordem` registra a sequência de assinaturas e de criação da sessão; `chamadasEmitirAccess`
// confere a fiação com o único caminho de emissão do access.
const ordem = [];
const chamadasEmitirAccess = [];
const createJwtReal = await import('../../../../src/utilities/createJwt.js');
jest.unstable_mockModule('../../../../src/utilities/createJwt.js', () => ({
  createJwt: (...args) => {
    ordem.push('createJwt');
    return createJwtReal.createJwt(...args);
  },
  assinarJwt: (...args) => {
    ordem.push('assinarJwt');
    return createJwtReal.assinarJwt(...args);
  }
}));
const emitirAccessReal = await import('../../../../src/utilities/emitirAccess.js');
jest.unstable_mockModule('../../../../src/utilities/emitirAccess.js', () => ({
  emitirAccess: (...args) => {
    chamadasEmitirAccess.push(args);
    return emitirAccessReal.emitirAccess(...args);
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

    ordem.length = 0;
    chamadasEmitirAccess.length = 0;
    jest.spyOn(SessaoLoginRepository.prototype, 'criar').mockImplementation(async () => {
      ordem.push('criar');
      return { id: 'sid-1' };
    });
    jest.spyOn(SessaoLoginRepository.prototype, 'limparDoUsuario').mockResolvedValue(0);

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
    jest.restoreAllMocks();
    jest.useRealTimers();
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

  test('o refresh emitido leva a claim de tipo da sessão e o sub do usuário', async () => {
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
    const { payload } = parseJwt(result.refreshToken);

    expect(payload.typ).toBe(Constants.refreshTokenType);
    expect(payload.sub).toBe('user-123');
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
  describe('sessão persistida no login', () => {
    const USER = { id: 'user-123', email: 'test@example.com', permissao: 'admin' };
    const AGORA = new Date('2026-11-18T15:00:00.000Z');
    const entrar = () => LoginService.handle('test@example.com', 'password123');

    beforeEach(() => {
      jest.useFakeTimers({
        doNotFake: ['nextTick', 'setImmediate', 'setTimeout', 'queueMicrotask']
      });
      jest.setSystemTime(AGORA);
      UserRepository.prototype.selectOne = async () => ({ ...USER, senha: SENHA_HASH });
    });

    test('cria a sessão 1 vez, antes de qualquer assinatura, e as claims saem corretas', async () => {
      const result = await entrar();

      const criar = SessaoLoginRepository.prototype.criar;
      expect(criar).toHaveBeenCalledTimes(1);
      expect(ordem).toEqual(['criar', 'createJwt', 'assinarJwt']);
      const [dados] = criar.mock.calls[0];
      const expiraEm = new Date(AGORA.getTime() + Constants.refreshExp * 1000);
      expect(dados.idUsuario).toBe('user-123');
      expect(typeof dados.jtiAtual).toBe('string');
      expect(dados.jtiAtual).not.toBe('');
      expect(dados.expiraEm).toEqual(expiraEm);

      const access = parseJwt(result.accessToken).payload;
      expect(access.sid).toBe('sid-1');
      expect(typeof access.jti).toBe('string');
      expect(access.ver).toBe(Constants.accessTokenVersion);
      expect(access.exp - access.iat).toBe(900);

      const refresh = parseJwt(result.refreshToken).payload;
      expect(refresh.sub).toBe('user-123');
      expect(refresh.typ).toBe(Constants.refreshTokenType);
      expect(refresh.sid).toBe('sid-1');
      expect(refresh.jti).toBe(dados.jtiAtual);
      expect(refresh.exp).toBe(expiraEm.getTime() / 1000);
    });

    test('o exp do refresh é o expiraEm da sessão, mesmo com o relógio andando durante a criação', async () => {
      SessaoLoginRepository.prototype.criar.mockImplementation(async () => {
        jest.setSystemTime(AGORA.getTime() + 5000);
        return { id: 'sid-1' };
      });
      jest.setSystemTime(AGORA.getTime() + 789);

      const result = await entrar();

      const [dados] = SessaoLoginRepository.prototype.criar.mock.calls[0];
      const refresh = parseJwt(result.refreshToken).payload;
      expect(Number.isInteger(refresh.exp)).toBe(true);
      expect(refresh.exp).toBe(Math.floor(dados.expiraEm.getTime() / 1000));
      expect(refresh.exp).toBe(AGORA.getTime() / 1000 + Constants.refreshExp);
    });

    test('o access sai de emitirAccess(user, sid)', async () => {
      await entrar();

      expect(chamadasEmitirAccess).toHaveLength(1);
      expect(chamadasEmitirAccess[0][0].id).toBe('user-123');
      expect(chamadasEmitirAccess[0][1]).toBe('sid-1');
    });

    test('dois logins: sid distintos e 4 jti distintos', async () => {
      SessaoLoginRepository.prototype.criar
        .mockResolvedValueOnce({ id: 'sid-1' })
        .mockResolvedValueOnce({ id: 'sid-2' });

      const a = await entrar();
      const b = await entrar();
      const claims = [a, b].map(r => ({
        access: parseJwt(r.accessToken).payload,
        refresh: parseJwt(r.refreshToken).payload
      }));

      expect(claims[0].access.sid).toBe('sid-1');
      expect(claims[0].refresh.sid).toBe('sid-1');
      expect(claims[1].access.sid).toBe('sid-2');
      expect(claims[1].refresh.sid).toBe('sid-2');
      const jtis = claims.flatMap(c => [c.access.jti, c.refresh.jti]);
      expect(new Set(jtis).size).toBe(4);
      expect(claims[0].access.jti).not.toBe(claims[0].refresh.jti);
    });

    test('limparDoUsuario é chamada 1 vez, depois de criar, com (user.id, 7)', async () => {
      const limpar = SessaoLoginRepository.prototype.limparDoUsuario;
      limpar.mockImplementation(async () => {
        ordem.push('limpar');
        return 0;
      });

      await entrar();

      expect(limpar).toHaveBeenCalledTimes(1);
      expect(limpar).toHaveBeenCalledWith('user-123', 7);
      expect(Constants.sessionCleanupDays).toBe(7);
      expect(ordem.slice(0, 2)).toEqual(['criar', 'limpar']);
    });

    test('falha da limpeza não derruba o login e fica no log só com name/code', async () => {
      const erro = new Error('args SENTINELA-LIMPEZA');
      erro.name = 'PrismaClientKnownRequestError';
      erro.code = 'P2010';
      SessaoLoginRepository.prototype.limparDoUsuario.mockRejectedValue(erro);
      const cap = capturarLog();

      const result = await entrar();

      expect(result.accessToken).toEqual(expect.any(String));
      expect(SessaoLoginRepository.prototype.criar).toHaveBeenCalledTimes(1);
      expect(cap.texto()).toContain('Falha na limpeza de sessões antigas');
      expect(cap.texto()).toContain('PrismaClientKnownRequestError');
      expect(cap.texto()).toContain('P2010');
      expect(cap.texto()).not.toContain('SENTINELA-LIMPEZA');
    });

    test('só criar e limparDoUsuario tocam o registro (nenhum outro método)', async () => {
      const ausentes = ['lerEstado', 'rotacionar', 'encerrar', 'substituirSucessor'].map(m =>
        jest.spyOn(SessaoLoginRepository.prototype, m)
      );

      await entrar();

      expect(SessaoLoginRepository.prototype.criar).toHaveBeenCalledTimes(1);
      expect(SessaoLoginRepository.prototype.limparDoUsuario).toHaveBeenCalledTimes(1);
      for (const spy of ausentes) expect(spy).not.toHaveBeenCalled();
    });

    test('criar rejeitando: ServiceUnavailableError, nada assinado, log só com name/code', async () => {
      const erro = new Error('args SENTINELA-LOGIN-503');
      erro.name = 'PrismaClientKnownRequestError';
      erro.code = 'P1001';
      SessaoLoginRepository.prototype.criar.mockRejectedValue(erro);
      const cap = capturarLog();

      await expect(entrar()).rejects.toBeInstanceOf(ServiceUnavailableError);

      expect(ordem).toEqual([]);
      expect(chamadasEmitirAccess).toHaveLength(0);
      expect(SessaoLoginRepository.prototype.limparDoUsuario).not.toHaveBeenCalled();
      expect(cap.texto()).toContain('Falha ao criar a sessão de login');
      expect(cap.texto()).toContain('P1001');
      expect(cap.texto()).not.toContain('SENTINELA-LOGIN-503');
    });
  });
});
