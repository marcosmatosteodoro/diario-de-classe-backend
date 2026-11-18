import { jest } from '@jest/globals';
import { capturarLog } from '../../../mocks/capturaDeLog.js';
import { estadoDeSessao } from '../../../mocks/estadoDeSessao.js';

// Contadores manuais: o `resetMocks: true` do projeto reseta a implementação de `jest.fn`.
const contagem = { queryRaw: 0, executeRaw: 0 };
let respostas = [];

jest.unstable_mockModule('../../../../src/db/prisma.js', () => ({
  default: {
    $queryRaw: async () => {
      contagem.queryRaw += 1;
      return respostas.shift() ?? [];
    },
    $executeRaw: async () => {
      contagem.executeRaw += 1;
      return 0;
    },
    sessaoLogin: {}
  }
}));

const { RefreshTokenService } = await import(
  '../../../../src/services/auth/refreshTokenService.js'
);
const { GetConfiguracaoService } = await import(
  '../../../../src/services/configuracao/getConfiguracaoService.js'
);
const { default: UserRepository } = await import('../../../../src/repositories/userRepository.js');
const { default: SessaoLoginRepository } = await import(
  '../../../../src/repositories/sessaoLoginRepository.js'
);
const { default: ServiceUnavailableError } = await import(
  '../../../../src/utilities/errors/serviceUnavailable.js'
);
const { createJwt } = await import('../../../../src/utilities/createJwt.js');
const { emitirRefresh } = await import('../../../../src/utilities/emitirRefresh.js');
const { default: Constants } = await import('../../../../src/utilities/constants.js');
const { base64url } = await import('../../../../src/utilities/base64url.js');

const decodificar = jwt => JSON.parse(Buffer.from(jwt.split('.')[1], 'base64').toString('utf8'));

const SENTINELA = 'SENTINELA-RENOVA-UNIDADE';
const SID = 'sid-de-teste';
const USUARIO = {
  id: 'user-123',
  email: 'test@example.com',
  nome: 'Test User',
  permissao: 'ADMIN'
};
// Fim absoluto da sessão: inteiro, longe da hora do sistema para não casar por acaso com `agora + refreshExp`.
const EXPIRA_EM_EPOCH = Math.floor(Date.now() / 1000) + 500000;
const RESTANTE = 499990;

// `jti: undefined` ou `sid: undefined` omitem a claim (o spread, ao contrário do default, respeita a chave).
const refreshDe = (sobre = {}) => {
  const { expiraEmEpoch, ...claims } = { sub: USUARIO.id, sid: SID, jti: 'jti-0', ...sobre };
  return emitirRefresh({
    ...claims,
    expiraEmEpoch: expiraEmEpoch ?? Math.floor(Date.now() / 1000) + 3600
  });
};

const estado = (sobre = {}) =>
  estadoDeSessao(USUARIO.id, {
    jtiAtual: 'jti-0',
    expiraEmEpoch: EXPIRA_EM_EPOCH,
    restanteSegundos: RESTANTE,
    ...sobre
  });

// Linha de `RETURNING` das escritas, no formato declarado no repository.
const linhaEscrita = sobre => ({
  jtiAtual: 'jti-novo',
  jtiAnterior: 'jti-0',
  expiraEmEpoch: EXPIRA_EM_EPOCH,
  restanteSegundos: RESTANTE,
  ...sobre
});

const erroDoRegistro = () => {
  const erro = new Error(`Invalid invocation com ${SENTINELA}`);
  erro.name = 'PrismaClientKnownRequestError';
  erro.code = 'P1001';
  return erro;
};

describe('RefreshTokenService', () => {
  let selectOne;
  let configuracoes;
  let lerEstado;
  let rotacionar;
  let substituirSucessor;
  let encerrar;

  const instalarRegistro = (lido = estado()) => {
    const proto = SessaoLoginRepository.prototype;
    lerEstado = jest.spyOn(proto, 'lerEstado').mockResolvedValue(lido);
    rotacionar = jest.spyOn(proto, 'rotacionar').mockResolvedValue(linhaEscrita());
    substituirSucessor = jest.spyOn(proto, 'substituirSucessor').mockResolvedValue(linhaEscrita());
    encerrar = jest.spyOn(proto, 'encerrar').mockResolvedValue(true);
  };

  const nenhumaEscrita = () => {
    expect(rotacionar).not.toHaveBeenCalled();
    expect(substituirSucessor).not.toHaveBeenCalled();
    expect(encerrar).not.toHaveBeenCalled();
  };

  beforeEach(() => {
    contagem.queryRaw = 0;
    contagem.executeRaw = 0;
    respostas = [];
    selectOne = jest.spyOn(UserRepository.prototype, 'selectOne').mockResolvedValue({ ...USUARIO });
    configuracoes = jest.spyOn(GetConfiguracaoService, 'handle').mockResolvedValue([{ id: 'c1' }]);
    instalarRegistro();
  });

  const executar = token => new RefreshTokenService(UserRepository, token).execute();

  describe('regras da DEC-005-015', () => {
    test('(a) jti atual rotaciona: 1 escrita com exatamente 3 argumentos e refresh novo da mesma sessão', async () => {
      const resultado = await executar(refreshDe({ jti: 'jti-0' }));

      expect(lerEstado).toHaveBeenCalledTimes(1);
      expect(lerEstado).toHaveBeenCalledWith(SID);
      expect(rotacionar).toHaveBeenCalledTimes(1);
      const argumentos = rotacionar.mock.calls[0];
      expect(argumentos).toHaveLength(3);
      expect(argumentos).toEqual([SID, 'jti-0', expect.any(String)]);
      expect(argumentos[2]).not.toBe('');
      expect(argumentos[2]).not.toBe('jti-0');
      expect(substituirSucessor).not.toHaveBeenCalled();
      expect(encerrar).not.toHaveBeenCalled();

      const refresh = decodificar(resultado.refreshToken);
      expect(refresh).toMatchObject({
        sub: USUARIO.id,
        sid: SID,
        jti: argumentos[2],
        typ: Constants.refreshTokenType
      });
      const access = decodificar(resultado.accessToken);
      expect(access).toMatchObject({
        sub: USUARIO.id,
        sid: SID,
        ver: Constants.accessTokenVersion
      });
      expect(typeof access.jti).toBe('string');
    });

    test('(b) jti anterior dentro da tolerância: nenhuma escrita e o refresh leva o jti atual lido', async () => {
      instalarRegistro(
        estado({ jtiAtual: 'jti-1', jtiAnterior: 'jti-0', dentroDaTolerancia: true })
      );

      const resultado = await executar(refreshDe({ jti: 'jti-0' }));

      nenhumaEscrita();
      expect(decodificar(resultado.refreshToken)).toMatchObject({ sid: SID, jti: 'jti-1' });
    });

    test('(c) jti anterior fora da tolerância: substitui o sucessor e devolve o novo jti', async () => {
      instalarRegistro(
        estado({ jtiAtual: 'jti-1', jtiAnterior: 'jti-0', dentroDaTolerancia: false })
      );

      const resultado = await executar(refreshDe({ jti: 'jti-0' }));

      expect(substituirSucessor).toHaveBeenCalledTimes(1);
      const argumentos = substituirSucessor.mock.calls[0];
      expect(argumentos).toEqual([SID, 'jti-0', 'jti-1', expect.any(String)]);
      expect(rotacionar).not.toHaveBeenCalled();
      expect(encerrar).not.toHaveBeenCalled();
      const jti = decodificar(resultado.refreshToken).jti;
      expect(jti).toBe(argumentos[3]);
      expect(['jti-0', 'jti-1']).not.toContain(jti);
    });

    test('(d) sessão ativa e jti que não é o atual nem o anterior: encerra com (sid, reuso) e devolve só { reuso }', async () => {
      instalarRegistro(estado({ jtiAtual: 'jti-1', jtiAnterior: 'jti-0' }));

      const resultado = await executar(refreshDe({ jti: 'jti-estranho' }));

      expect(resultado).toEqual({ reuso: { idUsuario: USUARIO.id, idSessao: SID } });
      expect(lerEstado).toHaveBeenCalledTimes(1);
      expect(encerrar).toHaveBeenCalledTimes(1);
      expect(encerrar.mock.calls[0]).toEqual([SID, 'reuso']);
      expect(rotacionar).not.toHaveBeenCalled();
      expect(substituirSucessor).not.toHaveBeenCalled();
      expect(selectOne).not.toHaveBeenCalled();
    });

    test('(d) com jti anterior nulo: o jti desconhecido também é reuso', async () => {
      instalarRegistro(estado({ jtiAtual: 'jti-1', jtiAnterior: null }));

      expect(await executar(refreshDe({ jti: 'jti-0' }))).toEqual({
        reuso: { idUsuario: USUARIO.id, idSessao: SID }
      });
      expect(encerrar).toHaveBeenCalledWith(SID, 'reuso');
    });

    test('(d) encerrar sem linhas (encerrada entre a leitura e a escrita): recusa simples, sem { reuso }', async () => {
      instalarRegistro(estado({ jtiAtual: 'jti-1', jtiAnterior: 'jti-0' }));
      encerrar.mockResolvedValue(false);

      expect(await executar(refreshDe({ jti: 'jti-estranho' }))).toBe(false);

      expect(encerrar).toHaveBeenCalledTimes(1);
      expect(rotacionar).not.toHaveBeenCalled();
      expect(substituirSucessor).not.toHaveBeenCalled();
    });

    test('(d) encerrar rejeitando: ServiceUnavailableError', async () => {
      instalarRegistro(estado({ jtiAtual: 'jti-1', jtiAnterior: 'jti-0' }));
      encerrar.mockRejectedValue(erroDoRegistro());
      capturarLog();

      await expect(executar(refreshDe({ jti: 'jti-estranho' }))).rejects.toBeInstanceOf(
        ServiceUnavailableError
      );
    });

    test.each([
      ['encerrada por sair', estado({ jtiAtual: 'jti-1', encerrada: true, ativa: false })],
      [
        'encerrada por reuso anterior',
        estado({ jtiAtual: 'jti-1', jtiAnterior: 'jti-0', encerrada: true, ativa: false })
      ],
      ['vencida', estado({ jtiAtual: 'jti-1', ativa: false, restanteSegundos: 0 })]
    ])(
      'sessão %s com jti que seria reuso: recusa simples, sem encerrar e sem { reuso } (ACH-14)',
      async (_n, lido) => {
        instalarRegistro(lido);

        expect(await executar(refreshDe({ jti: 'jti-estranho' }))).toBe(false);

        expect(lerEstado).toHaveBeenCalledTimes(1);
        nenhumaEscrita();
      }
    );

    test('sessão ativa de outro dono com jti estranho: recusa simples, sem encerrar', async () => {
      instalarRegistro(estado({ idUsuario: 'outro-usuario', jtiAtual: 'jti-1' }));

      expect(await executar(refreshDe({ jti: 'jti-estranho' }))).toBe(false);

      nenhumaEscrita();
    });
  });

  describe('recusa simples sem escrita', () => {
    test.each([
      ['sessão inexistente', null],
      ['sessão de outro usuário', estado({ idUsuario: 'outro-usuario' })],
      ['sessão encerrada', estado({ encerrada: true, ativa: false })],
      ['sessão vencida', estado({ ativa: false, restanteSegundos: 0 })]
    ])('%s', async (_nome, lido) => {
      instalarRegistro(lido);

      expect(await executar(refreshDe())).toBe(false);

      expect(lerEstado).toHaveBeenCalledTimes(1);
      nenhumaEscrita();
      expect(selectOne).not.toHaveBeenCalled();
    });

    test.each([
      [
        'refresh legado sem sid',
        () =>
          createJwt(
            { sub: USUARIO.id, typ: Constants.refreshTokenType, jti: 'j' },
            Constants.jwtRefreshSecret,
            60
          )
      ],
      ['refresh sem jti', () => refreshDe({ jti: undefined })],
      ['refresh com sid vazio', () => refreshDe({ sid: '' })],
      ['sem token', () => null],
      ['token vazio', () => ''],
      ['formato inválido', () => 'invalid-token'],
      [
        'assinatura arbitrária',
        () =>
          `${base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))}.${base64url(
            JSON.stringify({ sub: USUARIO.id, sid: SID, jti: 'jti-0' })
          )}.assinatura-forjada`
      ],
      [
        'segredo errado',
        () => createJwt({ sub: USUARIO.id, sid: SID, jti: 'jti-0' }, Constants.jwtSecret, 60)
      ],
      [
        'sem typ',
        () => createJwt({ sub: USUARIO.id, sid: SID, jti: 'jti-0' }, Constants.jwtRefreshSecret, 60)
      ],
      ['vencido', () => refreshDe({ expiraEmEpoch: Math.floor(Date.now() / 1000) - 10 })]
    ])('%s: nega sem consultar o registro', async (_nome, gerar) => {
      expect(await executar(gerar())).toBe(false);

      expect(lerEstado).not.toHaveBeenCalled();
      nenhumaEscrita();
      expect(selectOne).not.toHaveBeenCalled();
    });

    test('controle: o refresh válido consulta o registro 1 vez', async () => {
      await executar(refreshDe());

      expect(lerEstado).toHaveBeenCalledTimes(1);
    });

    test('usuário removido nega (a rotação já aconteceu e a repetição é aceita pela regra b/c)', async () => {
      selectOne.mockResolvedValue(null);

      expect(await executar(refreshDe())).toBe(false);
      expect(selectOne).toHaveBeenCalledWith({
        where: { id: USUARIO.id },
        select: new UserRepository().selectFields
      });
    });

    test('o gancho usuarioPodeRenovar decide a recusa', async () => {
      const gancho = jest
        .spyOn(RefreshTokenService.prototype, 'usuarioPodeRenovar')
        .mockReturnValue(false);

      expect(await executar(refreshDe())).toBe(false);
      expect(gancho).toHaveBeenCalledWith(expect.objectContaining({ id: USUARIO.id }));
    });
  });

  describe('usuarioPodeRenovar', () => {
    const service = () => new RefreshTokenService(UserRepository, 'x');

    test('é false para usuário ausente e true para usuário existente', () => {
      expect(service().usuarioPodeRenovar(null)).toBe(false);
      expect(service().usuarioPodeRenovar({ id: 'u1' })).toBe(true);
    });
  });

  describe('corrida perdida (FR-004-008)', () => {
    test('rotacionar sem linhas e releitura em tolerância: regra (b), 2 leituras e nenhuma escrita extra', async () => {
      lerEstado
        .mockResolvedValueOnce(estado())
        .mockResolvedValueOnce(
          estado({ jtiAtual: 'jti-1', jtiAnterior: 'jti-0', dentroDaTolerancia: true })
        );
      rotacionar.mockResolvedValue(null);

      const resultado = await executar(refreshDe({ jti: 'jti-0' }));

      expect(lerEstado).toHaveBeenCalledTimes(2);
      expect(rotacionar).toHaveBeenCalledTimes(1);
      expect(substituirSucessor).not.toHaveBeenCalled();
      expect(encerrar).not.toHaveBeenCalled();
      expect(decodificar(resultado.refreshToken).jti).toBe('jti-1');
    });

    test('substituirSucessor sem linhas e releitura em tolerância: regra (b)', async () => {
      lerEstado
        .mockResolvedValueOnce(
          estado({ jtiAtual: 'jti-1', jtiAnterior: 'jti-0', dentroDaTolerancia: false })
        )
        .mockResolvedValueOnce(
          estado({ jtiAtual: 'jti-2', jtiAnterior: 'jti-0', dentroDaTolerancia: true })
        );
      substituirSucessor.mockResolvedValue(null);

      const resultado = await executar(refreshDe({ jti: 'jti-0' }));

      expect(lerEstado).toHaveBeenCalledTimes(2);
      expect(substituirSucessor).toHaveBeenCalledTimes(1);
      expect(decodificar(resultado.refreshToken).jti).toBe('jti-2');
    });

    test.each([
      ['a releitura ainda pede a rotação', estado()],
      [
        'a releitura ainda pede a substituição',
        estado({ jtiAtual: 'jti-1', jtiAnterior: 'jti-0', dentroDaTolerancia: false })
      ]
    ])(
      '%s: ServiceUnavailableError com exatamente 2 leituras e 1 escrita (teto de 1 retry)',
      async (_n, relido) => {
        lerEstado.mockResolvedValueOnce(estado()).mockResolvedValue(relido);
        rotacionar.mockResolvedValue(null);
        substituirSucessor.mockResolvedValue(null);

        await expect(executar(refreshDe({ jti: 'jti-0' }))).rejects.toBeInstanceOf(
          ServiceUnavailableError
        );

        expect(lerEstado).toHaveBeenCalledTimes(2);
        expect(rotacionar.mock.calls.length + substituirSucessor.mock.calls.length).toBe(1);
        expect(encerrar).not.toHaveBeenCalled();
      }
    );

    test.each([
      ['encerrada', estado({ encerrada: true, ativa: false })],
      ['vencida', estado({ ativa: false, restanteSegundos: 0 })],
      ['inexistente', null]
    ])(
      'sessão %s entre a leitura e a escrita: recusa simples, sem encerrar',
      async (_n, relido) => {
        lerEstado.mockResolvedValueOnce(estado()).mockResolvedValueOnce(relido);
        rotacionar.mockResolvedValue(null);

        expect(await executar(refreshDe({ jti: 'jti-0' }))).toBe(false);

        expect(lerEstado).toHaveBeenCalledTimes(2);
        expect(rotacionar).toHaveBeenCalledTimes(1);
        expect(encerrar).not.toHaveBeenCalled();
        expect(selectOne).not.toHaveBeenCalled();
      }
    );

    test.each([
      ['rotacionar', () => estado(), 'rotacionar'],
      [
        'substituirSucessor',
        () => estado({ jtiAtual: 'jti-1', jtiAnterior: 'jti-0', dentroDaTolerancia: false }),
        'substituirSucessor'
      ]
    ])(
      'perdedor de %s cuja releitura cai em (d): recusa simples, sem encerrar e sem evento',
      async (_n, primeira, escrita) => {
        lerEstado
          .mockResolvedValueOnce(primeira())
          .mockResolvedValueOnce(estado({ jtiAtual: 'jti-2', jtiAnterior: 'jti-1' }));
        rotacionar.mockResolvedValue(null);
        substituirSucessor.mockResolvedValue(null);
        const cap = capturarLog();

        expect(await executar(refreshDe({ jti: 'jti-0' }))).toBe(false);

        expect(lerEstado).toHaveBeenCalledTimes(2);
        expect({ rotacionar, substituirSucessor }[escrita]).toHaveBeenCalledTimes(1);
        expect(encerrar).not.toHaveBeenCalled();
        expect(cap.texto()).not.toContain('auth.sessao.reuso');
      }
    );

    test('exceção depois da rotação: a falha sobe como está, sem encerrar a sessão', async () => {
      const falha = new Error('banco fora');
      selectOne.mockRejectedValue(falha);

      await expect(executar(refreshDe())).rejects.toBe(falha);

      expect(rotacionar).toHaveBeenCalledTimes(1);
      expect(encerrar).not.toHaveBeenCalled();
    });
  });

  describe('registro indisponível nega com 503', () => {
    test.each([
      ['lerEstado', () => lerEstado],
      ['rotacionar', () => rotacionar],
      ['substituirSucessor', () => substituirSucessor]
    ])(
      '%s rejeitando: ServiceUnavailableError, nada emitido e log só com name/code',
      async (nome, alvo) => {
        instalarRegistro(
          estado({ jtiAtual: 'jti-1', jtiAnterior: 'jti-0', dentroDaTolerancia: false })
        );
        if (nome === 'rotacionar') lerEstado.mockResolvedValue(estado());
        alvo().mockRejectedValue(erroDoRegistro());
        const cap = capturarLog();

        await expect(executar(refreshDe({ jti: 'jti-0' }))).rejects.toBeInstanceOf(
          ServiceUnavailableError
        );

        expect(selectOne).not.toHaveBeenCalled();
        expect(configuracoes).not.toHaveBeenCalled();
        expect(cap.texto()).toContain('PrismaClientKnownRequestError');
        expect(cap.texto()).toContain('P1001');
        expect(cap.texto()).not.toContain(SENTINELA);
      }
    );

    test('controle de detecção: a captura enxerga o sentinela quando ele é logado', () => {
      const cap = capturarLog();
      console.error(erroDoRegistro().message);
      expect(cap.texto()).toContain(SENTINELA);
    });
  });

  describe('renovação válida', () => {
    test('devolve os campos do contrato, com restanteSegundos e o refresh exp = fim absoluto da sessão', async () => {
      const resultado = await executar(refreshDe());

      expect(resultado).toEqual({
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
        tokenType: 'Bearer',
        expiresIn: Constants.accessExp,
        restanteSegundos: RESTANTE,
        user: USUARIO,
        configuracao: { id: 'c1' }
      });
      const { exp } = decodificar(resultado.refreshToken);
      expect(Number.isInteger(exp)).toBe(true);
      expect(exp).toBe(EXPIRA_EM_EPOCH);
      expect(exp).not.toBe(Math.floor(Date.now() / 1000) + Constants.refreshExp);
      expect(configuracoes).toHaveBeenCalledTimes(1);
    });

    test('lê o usuário por id com a projeção do repositório (senha fora)', async () => {
      await executar(refreshDe());

      expect(selectOne).toHaveBeenCalledTimes(1);
      expect(selectOne).toHaveBeenCalledWith({
        where: { id: USUARIO.id },
        select: new UserRepository().selectFields
      });
      expect(new UserRepository().selectFields.senha).toBe(false);
    });

    test('sem configuração, configuracao é null', async () => {
      configuracoes.mockResolvedValue([]);

      expect((await executar(refreshDe())).configuracao).toBeNull();
    });

    test('static handle devolve o mesmo contrato', async () => {
      const resultado = await RefreshTokenService.handle(refreshDe());

      expect(resultado).toHaveProperty('accessToken');
      expect(resultado.user.id).toBe(USUARIO.id);
    });
  });

  describe('orçamento da renovação comum (AC-004-016)', () => {
    test('regra (a) com o repository real: 2 chamadas a $queryRaw (1 leitura + 1 escrita) e 0 a $executeRaw', async () => {
      jest.restoreAllMocks();
      selectOne = jest
        .spyOn(UserRepository.prototype, 'selectOne')
        .mockResolvedValue({ ...USUARIO });
      jest.spyOn(GetConfiguracaoService, 'handle').mockResolvedValue([]);
      respostas = [[estado()], [linhaEscrita()]];

      const resultado = await executar(refreshDe({ jti: 'jti-0' }));

      expect(resultado).not.toBe(false);
      expect(contagem.queryRaw).toBe(2);
      expect(contagem.executeRaw).toBe(0);
      expect(respostas).toHaveLength(0);
    });
  });
});
