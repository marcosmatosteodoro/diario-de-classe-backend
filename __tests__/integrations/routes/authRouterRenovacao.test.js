import { jest } from '@jest/globals';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import request from 'supertest';
import {
  afirmarCookieRemovido,
  afirmarInvariantesDaRenovacao,
  cookiesDaSessao
} from '../../mocks/cookiesDaSessao.js';
import { refreshDeSessao } from '../../mocks/accessDeTeste.js';
import { parseJwt } from '../../../src/utilities/verifyJwt.js';
import { capturarLog } from '../../mocks/capturaDeLog.js';
import {
  armarBarreiraDeLeitura,
  armarGanchoEntreLeituraEEscrita,
  criarArmazenamentoExterno,
  instalarRegistroFalso,
  semearSessao
} from '../../mocks/sessoesEmMemoria.js';

// O import a frio da árvore de app.js chega perto do testTimeout global (10s).
const TIMEOUT_IMPORT_FRIO = 30000;

const pt = JSON.parse(readFileSync(join(process.cwd(), 'src/locales/pt/translation.json'), 'utf8'));
const ORIGEM = 'https://app.example.com';
const ORIGEM_FORJADA = 'https://evil.example.com';
const RENOVAR = '/api/auth/refresh-token';
const SAIR = '/api/auth/logout';
const LISTAGEM = '/api/alunos';
const SENTINELA = 'SENTINELA-RENOVA-503';
const RECUSA = { message: pt.auth.refresh.unauthorized };

const decodificar = jwt => parseJwt(jwt).payload;
const valorDoCookie = setCookie => setCookie.split(';')[0].slice('bls_sessao='.length);
const arquivosJs = pasta =>
  readdirSync(pasta).flatMap(nome => {
    const caminho = join(pasta, nome);
    return statSync(caminho).isDirectory() ? arquivosJs(caminho) : [caminho];
  });

describe('renovar pela rota real (app real, registro falso atômico)', () => {
  let app;
  let Constants;
  let UserRepository;
  let GetConfiguracaoService;
  let AbstractRepository;
  let SessaoLoginRepository;
  let createJwt;
  let verifyJwt;
  let corsOriginal;
  let sequencia = 0;

  let armazenamento;
  let registro;
  let selectOne;
  let configuracoes;
  const configuracao = { id: 'c1', nome: 'Config' };

  beforeAll(async () => {
    jest.resetModules();
    corsOriginal = process.env.CORS_ORIGINS;
    process.env.CORS_ORIGINS = ORIGEM;
    jest.unstable_mockModule('../../../src/InitialSetting.js', () => ({
      InitialSetting: { handle: jest.fn() }
    }));
    ({ default: Constants } = await import('../../../src/utilities/constants.js'));
    ({ default: UserRepository } = await import('../../../src/repositories/userRepository.js'));
    ({ default: AbstractRepository } = await import(
      '../../../src/repositories/abstractRepository.js'
    ));
    ({ default: SessaoLoginRepository } = await import(
      '../../../src/repositories/sessaoLoginRepository.js'
    ));
    ({ GetConfiguracaoService } = await import(
      '../../../src/services/configuracao/getConfiguracaoService.js'
    ));
    ({ createJwt } = await import('../../../src/utilities/createJwt.js'));
    ({ verifyJwt } = await import('../../../src/utilities/verifyJwt.js'));
    ({ default: app } = await import('../../../src/app.js?renovacao'));
  }, TIMEOUT_IMPORT_FRIO);

  afterAll(() => {
    if (corsOriginal === undefined) delete process.env.CORS_ORIGINS;
    else process.env.CORS_ORIGINS = corsOriginal;
  });

  beforeEach(async () => {
    sequencia += 1;
    armazenamento = criarArmazenamentoExterno();
    registro = await instalarRegistroFalso(armazenamento);
    selectOne = jest.spyOn(UserRepository.prototype, 'selectOne').mockImplementation(async arg => ({
      id: arg.where.id,
      email: 'ana@example.com',
      permissao: 'PROFESSOR',
      nome: 'Ana'
    }));
    configuracoes = jest.spyOn(GetConfiguracaoService, 'handle').mockResolvedValue([configuracao]);
    jest.spyOn(AbstractRepository.prototype, 'selectMany').mockResolvedValue([]);
  });

  const usuarioDoCaso = () => `usuario-${sequencia}`;
  const sidDoCaso = () => `sid-${sequencia}`;
  const refreshDe = ({ sub = usuarioDoCaso(), sid = sidDoCaso(), jti = 'jti-0' } = {}) =>
    refreshDeSessao({ sub, sid, jti });
  // Arrange só com o identificador: a sessão existe no armazenamento e o cookie leva sid/jti.
  const sessaoComCookie = ({
    jti = 'jti-0',
    sid = sidDoCaso(),
    idUsuario = usuarioDoCaso(),
    ...resto
  } = {}) => {
    semearSessao(armazenamento, { sid, idUsuario, jtiAtual: jti, ...resto });
    return refreshDe({ sub: idUsuario, sid, jti });
  };

  const chamar = (rota, { cookie, origem = ORIGEM } = {}) => {
    let req = request(app).post(rota);
    if (origem !== null) req = req.set('Origin', origem);
    if (cookie !== undefined) req = req.set('Cookie', `bls_sessao=${cookie}`);
    return req;
  };

  const renovar = async opcoes => {
    const res = await chamar(RENOVAR, opcoes);
    afirmarInvariantesDaRenovacao(res);
    return res;
  };

  const jtiDoCookie = res => decodificar(valorDoCookie(cookiesDaSessao(res)[0])).jti;
  const sair = cookie => chamar(SAIR, { cookie });
  const listar = access => request(app).get(LISTAGEM).set('Authorization', `Bearer ${access}`);

  describe('rotação: o novo permite renovar de novo (AC-004-005)', () => {
    test('200 com o contrato, cookie novo de jti diferente na mesma sessão, e o novo renova de novo', async () => {
      const usuario = usuarioDoCaso();
      const cookie = sessaoComCookie({ jti: 'jti-0' });

      const res = await renovar({ cookie });

      expect(res.status).toBe(200);
      const access = decodificar(res.body.accessToken);
      expect(access).toMatchObject({
        sub: usuario,
        id: usuario,
        sid: sidDoCaso(),
        ver: Constants.accessTokenVersion
      });
      expect(typeof access.jti).toBe('string');
      expect(res.body.tokenType).toBe('Bearer');
      expect(res.body.expiresIn).toBe(900);
      expect(res.body.user).toMatchObject({ id: usuario, email: 'ana@example.com' });
      expect(res.body.user).not.toHaveProperty('senha');
      expect(res.body.configuracao).toEqual(configuracao);
      expect(configuracoes).toHaveBeenCalledTimes(1);

      const novoCookie = valorDoCookie(cookiesDaSessao(res)[0]);
      expect(verifyJwt(novoCookie, Constants.jwtRefreshSecret)).toBeTruthy();
      expect(decodificar(novoCookie)).toMatchObject({ sid: sidDoCaso(), sub: usuario });
      expect(decodificar(novoCookie).jti).not.toBe('jti-0');
      expect(novoCookie).not.toBe(cookie);

      const segunda = await renovar({ cookie: novoCookie });
      expect(segunda.status).toBe(200);
    });
  });

  describe('concorrência de abas converge sem reuso (AC-004-009, parte servidor)', () => {
    test.each([
      ['ordem de chegada', [0, 1, 2]],
      ['ordem invertida', [2, 1, 0]],
      ['vencedor no meio', [1, 2, 0]]
    ])(
      '3 renovações simultâneas com o mesmo cookie (%s): todas 200, 1 sucessor',
      async (_n, ordem) => {
        const cookie = sessaoComCookie({ jti: 'jti-0' });
        armarBarreiraDeLeitura(armazenamento, 3, ordem);

        const respostas = await Promise.all([1, 2, 3].map(() => renovar({ cookie })));

        expect(armazenamento.liberacoes).toEqual(ordem);
        expect(respostas.map(r => r.status)).toEqual([200, 200, 200]);
        expect(registro.lerEstado).toHaveBeenCalledTimes(5);
        expect(registro.rotacionar).toHaveBeenCalledTimes(3);
        expect(registro.substituirSucessor).not.toHaveBeenCalled();
        expect(registro.encerrar).not.toHaveBeenCalled();
        const jtis = new Set(respostas.map(jtiDoCookie));
        expect(jtis.size).toBe(1);
        expect(jtis.has('jti-0')).toBe(false);
        const sessao = armazenamento.sessoes.get(sidDoCaso());
        expect(sessao.encerrada).toBe(false);
        expect([...jtis][0]).toBe(sessao.jtiAtual);
      }
    );

    test('ramo (c) a×a: 2 renovações simultâneas com o cookie perdido fora da tolerância: ambas 200, 1 sucessor', async () => {
      const cookie = sessaoComCookie({ jti: 'jti-0' });
      const preparo = await renovar({ cookie });
      expect(preparo.status).toBe(200);
      armazenamento.avancarRelogio(Constants.sessionRotationGraceSeconds + 1);
      armarBarreiraDeLeitura(armazenamento, 2);

      const respostas = await Promise.all([1, 2].map(() => renovar({ cookie })));

      expect(respostas.map(r => r.status)).toEqual([200, 200]);
      expect(registro.substituirSucessor).toHaveBeenCalledTimes(2);
      expect(registro.rotacionar).toHaveBeenCalledTimes(1);
      expect(registro.lerEstado).toHaveBeenCalledTimes(4);
      expect(registro.encerrar).not.toHaveBeenCalled();
      const jtis = new Set(respostas.map(jtiDoCookie));
      expect(jtis.size).toBe(1);
      expect(jtis.has(jtiDoCookie(preparo))).toBe(false);
    });
  });

  describe('sessão encerrada ou vencida entre a leitura e a escrita (AC-004-025, parte)', () => {
    test.each([
      [
        'encerrada',
        a => {
          a.sessoes.get(sidDoCaso()).encerrada = true;
        }
      ],
      ['vencida', a => a.avancarRelogio(7200)]
    ])(
      '%s: 401 simples, 2 leituras, 1 escrita sem linhas e nenhum encerrar',
      async (_n, gancho) => {
        const cookie = sessaoComCookie({ jti: 'jti-0' });
        armarGanchoEntreLeituraEEscrita(armazenamento, gancho);

        const res = await renovar({ cookie });

        expect(res.status).toBe(401);
        expect(res.body).toEqual(RECUSA);
        afirmarCookieRemovido(res);
        expect(res.body).not.toHaveProperty('accessToken');
        expect(registro.lerEstado).toHaveBeenCalledTimes(2);
        expect(registro.rotacionar).toHaveBeenCalledTimes(1);
        expect(registro.encerrar).not.toHaveBeenCalled();
        expect(selectOne).not.toHaveBeenCalled();
      }
    );
  });

  describe('credencial sem sessão e recusas (AC-004-010 parte, AC-004-004)', () => {
    test('refresh do BI-66 (sem sid/jti): 401 sem consultar o registro', async () => {
      const legado = createJwt(
        { sub: usuarioDoCaso(), typ: Constants.refreshTokenType },
        Constants.jwtRefreshSecret,
        Constants.refreshExp
      );

      const res = await renovar({ cookie: legado });

      expect(res.status).toBe(401);
      expect(res.body).not.toHaveProperty('accessToken');
      expect(registro.lerEstado).not.toHaveBeenCalled();
    });

    test('sid que o registro desconhece: 401 após 1 leitura', async () => {
      const res = await renovar({ cookie: refreshDe({ sid: 'sid-fantasma' }) });

      expect(res.status).toBe(401);
      expect(registro.lerEstado).toHaveBeenCalledTimes(1);
      expect(res.body).toEqual(RECUSA);
    });

    test('sessão vencida: 401 sem credencial', async () => {
      const cookie = sessaoComCookie({ vidaMs: -1000 });

      const res = await renovar({ cookie });

      expect(res.status).toBe(401);
      expect(res.body).not.toHaveProperty('accessToken');
      expect(registro.rotacionar).not.toHaveBeenCalled();
    });

    test('sair real e depois renovar com o mesmo cookie: 204 e depois 401 sem nada emitido', async () => {
      const cookie = sessaoComCookie();

      const saida = await sair(cookie);
      const res = await renovar({ cookie });

      expect(saida.status).toBe(204);
      expect(res.status).toBe(401);
      expect(res.body).toEqual(RECUSA);
      expect(registro.rotacionar).not.toHaveBeenCalled();
    });
  });

  describe('dono da sessão conferido pela rota real (AC-004-010 parte)', () => {
    const donoA = () => `dono-a-${sequencia}`;
    const donoB = () => `dono-b-${sequencia}`;
    const sidDeB = () => `sid-de-b-${sequencia}`;

    test('refresh assinado com sub de A e sid de sessão ativa de B: 401, nenhuma escrita e a sessão de B intacta', async () => {
      semearSessao(armazenamento, { sid: sidDeB(), idUsuario: donoB(), jtiAtual: 'jti-b' });
      const cookie = refreshDe({ sub: donoA(), sid: sidDeB(), jti: 'jti-b' });

      const res = await renovar({ cookie });

      expect(res.status).toBe(401);
      expect(res.body).toEqual(RECUSA);
      expect(registro.rotacionar).not.toHaveBeenCalled();
      expect(registro.substituirSucessor).not.toHaveBeenCalled();
      expect(registro.encerrar).not.toHaveBeenCalled();
      expect(selectOne).not.toHaveBeenCalled();
      const sessaoDeB = armazenamento.sessoes.get(sidDeB());
      expect([sessaoDeB.jtiAtual, sessaoDeB.encerrada]).toEqual(['jti-b', false]);
    });

    test('controle positivo: o refresh legítimo de B renova', async () => {
      semearSessao(armazenamento, { sid: sidDeB(), idUsuario: donoB(), jtiAtual: 'jti-b' });

      const res = await renovar({
        cookie: refreshDe({ sub: donoB(), sid: sidDeB(), jti: 'jti-b' })
      });

      expect(res.status).toBe(200);
      expect(armazenamento.sessoes.get(sidDeB()).jtiAnterior).toBe('jti-b');
    });
  });

  describe('registro indisponível nega com 503 (AC-004-013, parte a)', () => {
    const erroDoOrm = () => {
      const erro = new Error(`Invalid invocation com ${SENTINELA}`);
      erro.name = 'PrismaClientKnownRequestError';
      erro.code = 'P1001';
      return erro;
    };

    test('controle de detecção: a captura enxerga o sentinela quando ele é logado', () => {
      const cap = capturarLog();
      console.error({ aninhado: { valor: SENTINELA } });
      expect(cap.texto()).toContain(SENTINELA);
    });

    test.each([
      ['lerEstado', () => registro.lerEstado],
      ['rotacionar', () => registro.rotacionar]
    ])(
      '%s rejeitando: 503 exato, sem credencial, cookie nem regravado nem removido, sentinela fora do corpo e do log',
      async (_n, alvo) => {
        const cookie = sessaoComCookie();
        alvo().mockRejectedValue(erroDoOrm());
        const cap = capturarLog();

        const res = await renovar({ cookie });

        expect(res.status).toBe(503);
        expect(res.body).toEqual({
          error: 'ServiceUnavailableError',
          message: pt.api.errors.service_unavailable
        });
        expect(res.body).not.toHaveProperty('accessToken');
        expect(cookiesDaSessao(res)).toEqual([]);
        expect(JSON.stringify(res.body)).not.toContain(SENTINELA);
        expect(cap.texto()).toContain('PrismaClientKnownRequestError');
        expect(cap.texto()).toContain('P1001');
        expect(cap.texto()).not.toContain(SENTINELA);
        expect(registro.encerrar).not.toHaveBeenCalled();
      }
    );
  });

  describe('a renovação nunca estende a sessão (AC-004-018, parte)', () => {
    test('Max-Age = restante literal e exp do refresh = fim absoluto da sessão, mesmo com o relógio andando', async () => {
      armazenamento.relogioMs = Math.floor(Date.now() / 1000) * 1000 + 437;
      const cookie = sessaoComCookie({ vidaMs: 500000 * 1000 });
      const expiraEmMs = armazenamento.sessoes.get(sidDoCaso()).expiraEmMs;
      armarGanchoEntreLeituraEEscrita(armazenamento, a => a.avancarRelogio(1.5));

      const res = await renovar({ cookie });

      expect(res.status).toBe(200);
      const setCookie = cookiesDaSessao(res)[0];
      expect(setCookie).toContain('Max-Age=500000;');
      expect(setCookie).not.toContain(`Max-Age=${Constants.refreshExp};`);
      expect(setCookie).not.toContain('Max-Age=604800');
      expect(setCookie).toContain('HttpOnly');
      expect(setCookie).toContain('SameSite=Strict');
      expect(setCookie).toContain('Path=/api/auth');
      expect(setCookie).not.toContain('Secure');
      const { exp } = decodificar(valorDoCookie(setCookie));
      expect(Number.isInteger(exp)).toBe(true);
      expect(exp).toBe(Math.floor(expiraEmMs / 1000));
      expect(exp).not.toBe(Math.floor(Date.now() / 1000) + Constants.refreshExp);
    });

    test('a assinatura do refresh mora só no emissor: nenhum service nem controller toca o segredo', () => {
      const alvos = ['src/services', 'src/controllers'].flatMap(p =>
        arquivosJs(join(process.cwd(), p))
      );

      expect(alvos.length).toBeGreaterThan(10);
      expect(alvos.filter(f => readFileSync(f, 'utf8').includes('jwtRefreshSecret'))).toEqual([]);
    });
  });

  describe('resposta perdida é recuperada (AC-004-026)', () => {
    test('renova descartando a resposta, passa a tolerância e renova com o cookie original: 200 e sucessor novo', async () => {
      const cookie = sessaoComCookie({ jti: 'jti-0' });
      const perdida = await renovar({ cookie });
      const jti1 = jtiDoCookie(perdida);
      armazenamento.avancarRelogio(Constants.sessionRotationGraceSeconds + 1);

      const res = await renovar({ cookie });

      expect(res.status).toBe(200);
      const jti2 = jtiDoCookie(res);
      expect(jti2).not.toBe(jti1);
      expect(jti2).not.toBe('jti-0');
      expect(armazenamento.sessoes.get(sidDoCaso()).encerrada).toBe(false);
      expect(registro.substituirSucessor).toHaveBeenCalledTimes(1);
      expect(registro.encerrar).not.toHaveBeenCalled();
    });
  });

  describe('sair com renovação em voo (AC-004-025, parte)', () => {
    test('o access entregue pela renovação deixa de valer depois do sair', async () => {
      const cookie = sessaoComCookie();
      const renovacao = await renovar({ cookie });
      const access2 = renovacao.body.accessToken;
      expect((await listar(access2)).status).toBe(204);

      const saida = await sair(valorDoCookie(cookiesDaSessao(renovacao)[0]));
      const depois = await listar(access2);

      expect(renovacao.status).toBe(200);
      expect(saida.status).toBe(204);
      expect(depois.status).toBe(401);
    });
  });

  describe('orçamento da renovação comum (AC-004-016, parte)', () => {
    const contar = () => {
      const outros = jest
        .spyOn(SessaoLoginRepository.prototype, 'limparDoUsuario')
        .mockResolvedValue(0);
      return outros;
    };

    test('1 leitura e 1 escrita; nenhum outro método do registro', async () => {
      const limpar = contar();
      const cookie = sessaoComCookie();

      await renovar({ cookie });

      expect(registro.lerEstado).toHaveBeenCalledTimes(1);
      expect(registro.rotacionar).toHaveBeenCalledTimes(1);
      const demais = [registro.criar, registro.substituirSucessor, registro.encerrar, limpar];
      expect(demais.map(m => m.mock.calls.length)).toEqual([0, 0, 0, 0]);
    });

    test('controle positivo: criar e limparDoUsuario são vistos pelos espiões quando chamados', async () => {
      const limpar = contar();
      const repositorio = new SessaoLoginRepository();

      await repositorio.criar({ idUsuario: usuarioDoCaso(), jtiAtual: 'jti-x' });
      await repositorio.limparDoUsuario(usuarioDoCaso());

      expect(registro.criar).toHaveBeenCalledTimes(1);
      expect(limpar).toHaveBeenCalledTimes(1);
    });

    test('controle positivo: a regra (c) é vista pelo contador (substituirSucessor 1)', async () => {
      const cookie = sessaoComCookie();
      await renovar({ cookie });
      armazenamento.avancarRelogio(Constants.sessionRotationGraceSeconds + 1);

      await renovar({ cookie });

      expect(registro.substituirSucessor).toHaveBeenCalledTimes(1);
    });
  });

  describe('escrita dependente: falha depois da rotação (FR-004-008)', () => {
    test.each([
      ['dentro da tolerância (regra b)', 0],
      ['fora da tolerância (regra c)', 1]
    ])(
      'busca do usuário falha: 500 sem credencial e sem cookie; a repetição com o cookie original é aceita %s',
      async (_n, passaDoTolerancia) => {
        const cookie = sessaoComCookie();
        selectOne.mockRejectedValueOnce(new Error('banco fora'));

        const falha = await renovar({ cookie });

        expect(falha.status).toBe(500);
        expect(falha.body).not.toHaveProperty('accessToken');
        expect(cookiesDaSessao(falha)).toEqual([]);
        expect(registro.encerrar).not.toHaveBeenCalled();
        if (passaDoTolerancia) {
          armazenamento.avancarRelogio(Constants.sessionRotationGraceSeconds + 1);
        }

        const repeticao = await renovar({ cookie });

        expect(repeticao.status).toBe(200);
        expect(registro.encerrar).not.toHaveBeenCalled();
        expect(armazenamento.sessoes.get(sidDoCaso()).encerrada).toBe(false);
      }
    );
  });

  describe('invariantes por status (cookie e corpo)', () => {
    test('403 com origem forjada: cookie vazio e nada emitido', async () => {
      const cookie = sessaoComCookie();

      const res = await renovar({ cookie, origem: ORIGEM_FORJADA });

      expect(res.status).toBe(403);
      expect(registro.lerEstado).not.toHaveBeenCalled();
    });
  });
});
