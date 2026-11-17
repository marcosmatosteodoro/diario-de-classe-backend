import { setImmediate } from 'node:timers';
import express from 'express';
import request from 'supertest';
import util from 'node:util';
import { jest } from '@jest/globals';
import routes from '../../../src/routes.js';
import Constants from '../../../src/utilities/constants.js';
import TentativaLoginRepository from '../../../src/repositories/tentativaLoginRepository.js';
import { LoginService } from '../../../src/services/auth/loginService.js';
import { cookiesDaSessao } from '../../mocks/cookiesDaSessao.js';

const SENHA_SENTINELA = 'S3nh4-Sent1nela-Z9X8';
const EMAIL = 'joao.silva@example.com';
const IP = '203.0.113.10';

const loginOk = { accessToken: 'a', refreshToken: 'r', tokenType: 'Bearer', user: { id: '1' } };

function buildApp() {
  const app = express();
  app.set('trust proxy', true);
  app.use(express.json());
  app.use((req, res, next) => {
    req.t = key => key;
    next();
  });
  // Router real de src/routes.js: a ordem dos middlewares de /auth/login é o que se prova.
  app.use('/', routes);
  return app;
}

// Dublê atômico por chave (como o UPSERT ... RETURNING): a mutação é síncrona e a latência
// vem depois dela. A regra da janela em SQL é provada em tentativaLoginRepository.test.js.
// `criadas` é métrica do dublê (chaves distintas já criadas), não estado: é o que
// o teste de crescimento da tabela observa.
function installStore() {
  const store = new Map();
  store.criadas = new Set();
  jest
    .spyOn(TentativaLoginRepository.prototype, 'incrementar')
    .mockImplementation(async (chave, janelaSegundos) => {
      const atual = store.get(chave);
      const agora = Date.now();
      let linha;
      if (!atual || atual.expiraEm <= agora) {
        linha = { contagem: 1, expiraEm: agora + janelaSegundos * 1000 };
        store.set(chave, linha);
        store.criadas.add(chave);
      } else {
        atual.contagem += 1;
        linha = atual;
      }
      const resultado = {
        contagem: linha.contagem,
        segundosRestantes: Math.max(Math.ceil((linha.expiraEm - agora) / 1000), 1),
        expiraEm: String(linha.expiraEm)
      };
      await new Promise(resolve => setImmediate(resolve));
      return resultado;
    });
  // Deliberadamente mais permissivo que a produção (que exige a janela): sem expiraEm o
  // dublê altera a linha incondicionalmente, para um chamador que omite a janela aparecer
  // nos testes. `expiraEm` é token opaco (string), comparado só por igualdade.
  jest
    .spyOn(TentativaLoginRepository.prototype, 'decrementar')
    .mockImplementation(async (chave, expiraEm) => {
      const atual = store.get(chave);
      const alvo =
        atual && (expiraEm === undefined || String(atual.expiraEm) === expiraEm) ? atual : null;
      if (alvo) alvo.contagem = Math.max(alvo.contagem - 1, 0);
      await new Promise(resolve => setImmediate(resolve));
      return alvo ? 1 : 0;
    });
  jest
    .spyOn(TentativaLoginRepository.prototype, 'removerPorChave')
    .mockImplementation(async chave => ({ count: store.delete(chave) ? 1 : 0 }));
  return store;
}

// Toda recusa/erro do login (401, 429, 503, 500) nega também o canal do cookie: o refresh
// viaja em `bls_sessao`, então só o corpo sem token não basta.
const login = async (app, { email = EMAIL, senha = 'errada', ip = IP } = {}) => {
  const r = await request(app)
    .post('/auth/login')
    .set('X-Forwarded-For', ip)
    .send({ email, senha });
  if (r.status !== 200) expect(cookiesDaSessao(r)).toEqual([]);
  return r;
};

describe('POST /auth/login (router real) - limite de tentativas por janela', () => {
  let app;
  let store;
  let now;
  let loginSpy;
  let warnSpy;
  let errorSpy;

  const capturado = spy =>
    spy.mock.calls
      .map(args => util.format(...args.map(a => util.inspect(a, { depth: null }))))
      .join('\n');

  beforeEach(() => {
    now = 1_800_000_000_000;
    jest.spyOn(Date, 'now').mockImplementation(() => now);
    store = installStore();
    app = buildApp();
    loginSpy = jest.spyOn(LoginService, 'handle').mockResolvedValue(null);
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  test('após o teto de falhas no mesmo IP+e-mail, a próxima recebe 429 com Retry-After e não chama o LoginService', async () => {
    for (let i = 0; i < Constants.loginMaxTentativasPorEmail; i++) {
      const r = await login(app);
      expect(r.status).toBe(401);
    }
    expect(loginSpy).toHaveBeenCalledTimes(5);

    loginSpy.mockResolvedValue(loginOk);
    const r = await login(app, { senha: 'certa' });

    expect(r.status).toBe(429);
    expect(r.headers['retry-after']).toBe('900');
    expect(r.body).toEqual({ message: 'auth.login.too_many_attempts' });
    expect(loginSpy).toHaveBeenCalledTimes(5);
  });

  test('Retry-After reflete os segundos restantes da janela', async () => {
    for (let i = 0; i < 5; i++) await login(app);
    now += 100_000;

    const r = await login(app);

    expect(r.status).toBe(429);
    expect(r.headers['retry-after']).toBe('800');
  });

  test('e-mail diferente no mesmo IP não é bloqueado pelo teto por IP+e-mail', async () => {
    for (let i = 0; i < 5; i++) await login(app);

    const r = await login(app, { email: 'outro@example.com' });

    expect(r.status).toBe(401);
  });

  test('mesmo e-mail em IP diferente não é bloqueado', async () => {
    for (let i = 0; i < 5; i++) await login(app);

    const r = await login(app, { ip: '203.0.113.99' });

    expect(r.status).toBe(401);
  });

  test('e-mail com caixa/espaços diferentes cai na mesma chave', async () => {
    for (let i = 0; i < 5; i++) await login(app, { email: '  Joao.Silva@EXAMPLE.com ' });

    const r = await login(app);

    expect(r.status).toBe(429);
  });

  test('teto por IP com e-mails variados: a tentativa seguinte ao teto recebe 429', async () => {
    for (let i = 0; i < Constants.loginMaxTentativasPorIp; i++) {
      const r = await login(app, { email: `pessoa${i}@example.com` });
      expect(r.status).toBe(401);
    }
    const chamadas = loginSpy.mock.calls.length;

    const r = await login(app, { email: 'nova.pessoa@example.com' });

    expect(r.status).toBe(429);
    expect(r.headers['retry-after']).toBeDefined();
    expect(loginSpy).toHaveBeenCalledTimes(chamadas);
  });

  test('recusa pelo e-mail não consome o teto do IP: outro e-mail no mesmo IP chega ao LoginService', async () => {
    const { loginMaxTentativasPorEmail: porEmail, loginMaxTentativasPorIp: porIp } = Constants;
    for (let i = 0; i < porEmail; i++) await login(app);
    for (let i = 0; i < porIp - porEmail; i++) {
      expect((await login(app)).status).toBe(429);
    }
    const chamadas = loginSpy.mock.calls.length;

    const r = await login(app, { email: 'colega@example.com' });

    expect(r.status).toBe(401);
    expect(loginSpy).toHaveBeenCalledTimes(chamadas + 1);
  });

  test('Retry-After vem da janela que recusou: IP e IP+e-mail têm janelas distintas', async () => {
    await login(app, { email: 'primeiro@example.com' });
    now += 600_000;
    for (let i = 0; i < Constants.loginMaxTentativasPorEmail; i++) await login(app);

    const porEmail = await login(app);

    expect(porEmail.status).toBe(429);
    expect(porEmail.headers['retry-after']).toBe('900');

    // 1 (primeiro) + 5 (A) = 6 reservas no IP; completa o teto com e-mails distintos.
    for (let i = 0; i < Constants.loginMaxTentativasPorIp - 6; i++) {
      await login(app, { email: `pessoa${i}@example.com` });
    }
    const porIp = await login(app, { email: 'nova.pessoa@example.com' });

    expect(porIp.status).toBe(429);
    expect(porIp.headers['retry-after']).toBe('300');
  });

  test('IP acima do teto com e-mails distintos não cria chaves IP+e-mail sem limite', async () => {
    const total = 100;

    for (let i = 0; i < total; i++) await login(app, { email: `pessoa${i}@example.com` });

    const chavesIpEmail = [...store.criadas].filter(chave => chave.startsWith('ip-email:'));
    expect(chavesIpEmail.length).toBe(Constants.loginMaxTentativasPorIp);
  });

  describe('devolução da reserva do IP fica na janela da reserva', () => {
    const teto = Constants.loginMaxTentativasPorIp;

    // Segura a devolução atrasada (a primeira chamada) até `liberar()`; as demais seguem direto.
    const segurarPrimeiraDevolucao = () => {
      const original = TentativaLoginRepository.prototype.decrementar.getMockImplementation();
      let liberar;
      const portao = new Promise(resolve => (liberar = resolve));
      let seguraChamada = null;
      let primeira = true;
      TentativaLoginRepository.prototype.decrementar.mockImplementation(async (...args) => {
        if (primeira) {
          primeira = false;
          seguraChamada = args;
          await portao;
        }
        return original(...args);
      });
      const chegou = async () => {
        for (let i = 0; i < 1000 && !seguraChamada; i++) {
          await new Promise(resolve => setImmediate(resolve));
        }
        return seguraChamada;
      };
      return { liberar, chegou };
    };

    // Janela nova com 1 reserva já feita; devem caber exatamente `teto` no total.
    const completarEEsgotarJanelaNova = async () => {
      for (let i = 0; i < teto - 1; i++) {
        expect((await login(app, { email: `nova${i}@example.com` })).status).toBe(401);
      }
      expect((await login(app, { email: 'excedente@example.com' })).status).toBe(429);
    };

    test('recusa: a devolução atrasada de uma reserva da janela anterior não libera tentativas na janela nova', async () => {
      for (let i = 0; i < teto; i++) await login(app, { email: `pessoa${i}@example.com` });
      const devolucao = segurarPrimeiraDevolucao();

      const recusada = login(app, { email: 'recusada@example.com' }).then(r => r);
      const args = await devolucao.chegou();
      expect(args[1]).toBe(String(now + Constants.loginJanelaSegundos * 1000));

      now += Constants.loginJanelaSegundos * 1000 + 1;
      expect((await login(app, { email: 'primeira.da.nova@example.com' })).status).toBe(401);
      devolucao.liberar();
      expect((await recusada).status).toBe(429);

      await completarEEsgotarJanelaNova();
    });

    test('recusa por e-mail: a devolução atrasada também fica na janela da reserva', async () => {
      for (let i = 0; i < Constants.loginMaxTentativasPorEmail; i++) await login(app);
      const devolucao = segurarPrimeiraDevolucao();

      const recusada = login(app).then(r => r);
      expect(await devolucao.chegou()).not.toBeNull();

      now += Constants.loginJanelaSegundos * 1000 + 1;
      expect((await login(app, { email: 'primeira.da.nova@example.com' })).status).toBe(401);
      devolucao.liberar();
      expect((await recusada).status).toBe(429);

      await completarEEsgotarJanelaNova();
    });

    test('sucesso: a devolução atrasada com a janela antiga não altera a janela nova', async () => {
      loginSpy.mockResolvedValueOnce(loginOk);
      const devolucao = segurarPrimeiraDevolucao();

      const sucesso = login(app, { senha: 'certa' }).then(r => r);
      const args = await devolucao.chegou();
      expect(args[1]).toBe(String(now + Constants.loginJanelaSegundos * 1000));

      now += Constants.loginJanelaSegundos * 1000 + 1;
      expect((await login(app, { email: 'primeira.da.nova@example.com' })).status).toBe(401);
      devolucao.liberar();
      expect((await sucesso).status).toBe(200);

      await completarEEsgotarJanelaNova();
    });

    describe('devolução do IP usa a janela da reserva do IP, não a do e-mail', () => {
      const EMAIL_JANELA = 'abre.janela.ip@example.com';
      let fimIp;

      beforeEach(async () => {
        await login(app, { email: EMAIL_JANELA });
        fimIp = String(now + Constants.loginJanelaSegundos * 1000);
        now += 100_000;
      });

      test('sucesso com e-mail devolve o IP com o fim da janela do IP', async () => {
        loginSpy.mockResolvedValue(loginOk);

        const r = await login(app, { senha: 'certa' });

        expect(r.status).toBe(200);
        expect(TentativaLoginRepository.prototype.decrementar).toHaveBeenLastCalledWith(
          expect.stringMatching(/^ip:/),
          fimIp
        );
      });

      test('recusa por e-mail devolve o IP com o fim da janela do IP', async () => {
        for (let i = 0; i < Constants.loginMaxTentativasPorEmail; i++) {
          expect((await login(app)).status).toBe(401);
        }

        expect((await login(app)).status).toBe(429);

        expect(TentativaLoginRepository.prototype.decrementar).toHaveBeenLastCalledWith(
          expect.stringMatching(/^ip:/),
          fimIp
        );
      });
    });
  });

  test('sucesso zera o contador IP+e-mail', async () => {
    for (let i = 0; i < 4; i++) await login(app);
    loginSpy.mockResolvedValue(loginOk);
    expect((await login(app, { senha: 'certa' })).status).toBe(200);

    loginSpy.mockResolvedValue(null);
    for (let i = 0; i < 4; i++) {
      expect((await login(app)).status).toBe(401);
    }
    expect((await login(app)).status).toBe(401);
    expect((await login(app)).status).toBe(429);
  });

  test('janela expirada recomeça a contagem', async () => {
    for (let i = 0; i < 5; i++) await login(app);
    expect((await login(app)).status).toBe(429);

    now += Constants.loginJanelaSegundos * 1000 + 1;

    expect((await login(app)).status).toBe(401);
  });

  test('credencial inválida devolve 401 com a mensagem de sempre', async () => {
    const r = await login(app);

    expect(r.status).toBe(401);
    expect(r.body).toEqual({ message: 'auth.login.unauthorized' });
  });

  test('credencial ausente segue sem chegar ao serviço (validação existente) e não consome o contador', async () => {
    const r = await request(app).post('/auth/login').set('X-Forwarded-For', IP).send({});
    expect(r.status).toBe(422);
    expect(cookiesDaSessao(r)).toEqual([]);
    expect(r.status).toBe(422);
    expect(loginSpy).not.toHaveBeenCalled();
    expect(store.size).toBe(0);
  });

  test('sucesso devolve a tentativa ao contador por IP: logins legítimos não consomem o teto do IP', async () => {
    loginSpy.mockResolvedValue(loginOk);
    for (let i = 0; i < Constants.loginMaxTentativasPorIp + 5; i++) {
      expect((await login(app, { email: `pessoa${i}@example.com`, senha: 'certa' })).status).toBe(
        200
      );
    }

    loginSpy.mockResolvedValue(null);
    expect((await login(app, { email: 'outra@example.com' })).status).toBe(401);
  });

  test('requisições concorrentes no mesmo IP+e-mail: no máximo o teto chega ao LoginService, o resto recebe 429', async () => {
    const total = 25;

    const respostas = await Promise.all(Array.from({ length: total }, () => login(app)));

    const status = respostas.map(r => r.status);
    expect(loginSpy.mock.calls.length).toBeLessThanOrEqual(Constants.loginMaxTentativasPorEmail);
    expect(status.filter(s => s === 429)).toHaveLength(
      total - Constants.loginMaxTentativasPorEmail
    );
    expect(status.filter(s => s === 401)).toHaveLength(Constants.loginMaxTentativasPorEmail);
    respostas
      .filter(r => r.status === 429)
      .forEach(r => expect(r.headers['retry-after']).toBe('900'));
  });

  describe('log', () => {
    test('controle positivo: a captura detecta a senha quando ela está no log', () => {
      console.warn('x', { senha: SENHA_SENTINELA, email: EMAIL });
      console.error('y', new Error(`Invalid invocation senha: "${SENHA_SENTINELA}"`));

      expect(capturado(warnSpy)).toContain(SENHA_SENTINELA);
      expect(capturado(warnSpy)).toContain(EMAIL);
      expect(capturado(errorSpy)).toContain(SENHA_SENTINELA);
    });

    test('falha de login loga IP e e-mail mascarado, sem senha nem e-mail em claro', async () => {
      const r = await login(app, { senha: SENHA_SENTINELA });

      expect(r.status).toBe(401);
      const texto = capturado(warnSpy);
      expect(texto).toContain(IP);
      expect(texto).toContain('j***@example.com');
      expect(texto).not.toContain(SENHA_SENTINELA);
      expect(texto).not.toContain(EMAIL);
    });

    test('bloqueio loga IP e e-mail mascarado, sem senha nem e-mail em claro', async () => {
      for (let i = 0; i < 5; i++) await login(app);
      warnSpy.mockClear();

      const r = await login(app, { senha: SENHA_SENTINELA });

      expect(r.status).toBe(429);
      expect(warnSpy).toHaveBeenCalledTimes(1);
      const texto = capturado(warnSpy);
      expect(texto).toContain(IP);
      expect(texto).toContain('j***@example.com');
      expect(texto).not.toContain(SENHA_SENTINELA);
      expect(texto).not.toContain(EMAIL);
    });
  });

  describe('fail secure', () => {
    const erroDoOrm = () => {
      const e = new Error(`Invalid invocation: email "${EMAIL}" senha "${SENHA_SENTINELA}"`);
      e.name = 'PrismaClientKnownRequestError';
      e.code = 'P1001';
      return e;
    };

    test('contador indisponível na consulta: login negado, LoginService não chamado, log sem e-mail nem senha', async () => {
      TentativaLoginRepository.prototype.incrementar.mockRejectedValue(erroDoOrm());
      loginSpy.mockResolvedValue(loginOk);

      const r = await login(app, { senha: SENHA_SENTINELA });

      expect(r.status).toBe(503);
      expect(r.body).not.toHaveProperty('accessToken');
      expect(cookiesDaSessao(r)).toEqual([]);
      expect(loginSpy).not.toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalled();
      const texto = capturado(errorSpy);
      expect(texto).not.toContain(SENHA_SENTINELA);
      expect(texto).not.toContain(EMAIL);
    });

    test('contador falhando na reserva em uma chave só: login negado, LoginService não chamado', async () => {
      TentativaLoginRepository.prototype.incrementar.mockImplementation(async chave => {
        if (chave.startsWith('ip:')) throw erroDoOrm();
        return { contagem: 1, segundosRestantes: 900 };
      });
      loginSpy.mockResolvedValue(loginOk);

      const r = await login(app, { senha: SENHA_SENTINELA });

      expect(r.status).toBe(503);
      expect(loginSpy).not.toHaveBeenCalled();
      expect(capturado(errorSpy)).not.toContain(SENHA_SENTINELA);
      expect(capturado(errorSpy)).not.toContain(EMAIL);
    });

    test('contador falhando ao devolver a reserva do IP numa recusa: 503, LoginService não chamado', async () => {
      for (let i = 0; i < Constants.loginMaxTentativasPorIp; i++) {
        await login(app, { email: `pessoa${i}@example.com` });
      }
      const chamadas = loginSpy.mock.calls.length;
      loginSpy.mockResolvedValue(loginOk);
      TentativaLoginRepository.prototype.decrementar.mockRejectedValue(erroDoOrm());

      const r = await login(app, { email: 'nova@example.com', senha: SENHA_SENTINELA });

      expect(r.status).toBe(503);
      expect(r.body).not.toHaveProperty('accessToken');
      expect(cookiesDaSessao(r)).toEqual([]);
      expect(loginSpy).toHaveBeenCalledTimes(chamadas);
      expect(capturado(errorSpy)).not.toContain(SENHA_SENTINELA);
    });

    test('contador falhando ao devolver a reserva do IP na recusa por e-mail: 503, LoginService não chamado', async () => {
      for (let i = 0; i < Constants.loginMaxTentativasPorEmail; i++) await login(app);
      const chamadas = loginSpy.mock.calls.length;
      TentativaLoginRepository.prototype.decrementar.mockRejectedValue(erroDoOrm());

      const r = await login(app);

      expect(r.status).toBe(503);
      expect(loginSpy).toHaveBeenCalledTimes(chamadas);
    });

    test('contador falhando ao apagar a chave no sucesso: login negado, sem tokens', async () => {
      loginSpy.mockResolvedValue(loginOk);
      TentativaLoginRepository.prototype.removerPorChave.mockRejectedValue(erroDoOrm());

      const r = await login(app, { senha: 'certa' });

      expect(r.status).toBe(500);
      expect(r.body).not.toHaveProperty('accessToken');
      expect(cookiesDaSessao(r)).toEqual([]);
    });

    test('contador falhando ao decrementar no sucesso: login negado, sem tokens', async () => {
      loginSpy.mockResolvedValue(loginOk);
      TentativaLoginRepository.prototype.decrementar.mockRejectedValue(erroDoOrm());

      const r = await login(app, { senha: 'certa' });

      expect(r.status).toBe(500);
      expect(r.body).not.toHaveProperty('accessToken');
      expect(cookiesDaSessao(r)).toEqual([]);
    });
  });
});
