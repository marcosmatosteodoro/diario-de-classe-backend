import { jest } from '@jest/globals';
import request from 'supertest';
import { cuid, tokenDe } from '../../mocks/accessDeTeste.js';
import { passwordCustoBarato } from '../../mocks/passwordCustoBarato.js';
import { seedAgendaEmMemoria } from '../../mocks/seedAgendaEmMemoria.js';
import { sessaoAtiva } from '../../mocks/sessaoAtiva.js';

// O import a frio da árvore de app.js chega perto do testTimeout global (10s).
const TIMEOUT_IMPORT_FRIO = 30000;

const HOJE = '2026-11-20';
const SENHA = 'senha-sentinela-login';
const EMAIL_ADMIN = 'admin.demo@example.com';
const EMAIL_PROFESSOR = 'professor.demo@example.com';

// Itera dias civis sem usar o calendário do seed (o oráculo não pode ser o código sob prova).
const diasDe = (inicio, fim) => {
  const dias = [];
  for (let t = Date.parse(`${inicio}T00:00:00Z`); t <= Date.parse(`${fim}T00:00:00Z`); t += 864e5) {
    dias.push(new Date(t).toISOString().slice(0, 10));
  }
  return dias;
};

describe('login e agenda das contas do seed pela rota real', () => {
  let app;
  let Constants;
  let prismaMock;
  let UserRepository;
  let SessaoLoginRepository;
  let TentativaLoginRepository;
  let GetConfiguracaoService;
  let isHash;
  let parseJwt;
  let gravados;
  let argumentosAula;
  let aulasComId;
  let alunosComId;
  let findManyOriginal;

  beforeAll(async () => {
    jest.unstable_mockModule('../../../src/InitialSetting.js', () => ({
      InitialSetting: { handle: jest.fn() }
    }));
    const real = await import('../../../src/utilities/password.js');
    jest.unstable_mockModule('../../../src/utilities/password.js', () => passwordCustoBarato(real));
    ({ isHash } = real);
    ({ default: Constants } = await import('../../../src/utilities/constants.js'));
    ({ default: prismaMock } = await import('../../mocks/prismaMock.js'));
    ({ parseJwt } = await import('../../../src/utilities/verifyJwt.js'));
    ({ default: UserRepository } = await import('../../../src/repositories/userRepository.js'));
    ({ default: SessaoLoginRepository } = await import(
      '../../../src/repositories/sessaoLoginRepository.js'
    ));
    ({ default: TentativaLoginRepository } = await import(
      '../../../src/repositories/tentativaLoginRepository.js'
    ));
    ({ GetConfiguracaoService } = await import(
      '../../../src/services/configuracao/getConfiguracaoService.js'
    ));
    const { coletarCreateServices } = await import('../../mocks/coletorCreateServices.js');
    const { executarEtapas } = await import('../../../src/db/seeds/seedEtapas.js');
    const { ConfiguracaoEscolaSeed } = await import(
      '../../../src/db/seeds/models/configuracaoEscolaSeed.js'
    );
    const { UpdateAulasContratoService } = await import(
      '../../../src/services/contrato/updateAulasContratoService.js'
    );
    ({ default: app } = await import('../../../src/app.js?seedLoginEAgenda'));

    // O seed roda uma vez: o `CreateUserService` real (com hash) grava no repositório espiado.
    gravados = [];
    jest.spyOn(UserRepository.prototype, 'create').mockImplementation(async registro => {
      const gravado = { id: cuid(`usuario${gravados.length + 1}`), ...registro };
      gravados.push(gravado);
      return gravado;
    });
    jest.spyOn(ConfiguracaoEscolaSeed, 'handle').mockResolvedValue({ configuracoes: 1, dias: [] });
    jest.spyOn(UpdateAulasContratoService, 'handle').mockImplementation(async id => ({ id }));
    const coletor = coletarCreateServices({ reais: ['usuario'] });
    await executarEtapas({ hoje: HOJE, senha: SENHA });

    argumentosAula = coletor.argumentos.aula;
    // O id do coletor repete entre `aula1`, `aula10` e `aula100` (padEnd do cuid): id próprio.
    aulasComId = argumentosAula.map((aula, i) => ({
      ...aula,
      id: `aula-${String(i).padStart(4, '0')}`
    }));
    alunosComId = (await Promise.all(coletor.spies.aluno.mock.results.map(r => r.value))).map(
      ({ id, nome }) => ({ id, nome })
    );
    jest.restoreAllMocks();
  }, TIMEOUT_IMPORT_FRIO);

  let contagens;
  let configuracoes;
  beforeEach(() => {
    contagens = new Map();
    jest
      .spyOn(TentativaLoginRepository.prototype, 'incrementar')
      .mockImplementation(async chave => {
        const contagem = (contagens.get(chave) ?? 0) + 1;
        contagens.set(chave, contagem);
        return { contagem, segundosRestantes: 900, expiraEm: '1' };
      });
    jest.spyOn(TentativaLoginRepository.prototype, 'decrementar').mockResolvedValue(1);
    jest
      .spyOn(TentativaLoginRepository.prototype, 'removerPorChave')
      .mockResolvedValue({ count: 1 });
    // `LoginService.handle(email, senha)` roda real; só a leitura do usuário é dublada.
    jest.spyOn(UserRepository.prototype, 'selectOne').mockImplementation(async ({ where }) => {
      const gravado = gravados.find(usuario => usuario.email === where.email);
      return gravado ? { ...gravado } : null;
    });
    jest.spyOn(SessaoLoginRepository.prototype, 'criar').mockResolvedValue({ id: 'sid-login-1' });
    jest.spyOn(SessaoLoginRepository.prototype, 'limparDoUsuario').mockResolvedValue(0);
    configuracoes = jest
      .spyOn(GetConfiguracaoService, 'handle')
      .mockResolvedValue([{ id: 'c1', duracaoAula: 40, tolerancia: 10 }]);

    findManyOriginal = prismaMock.aula.findMany;
    prismaMock.aula.findMany = seedAgendaEmMemoria({
      aulas: aulasComId,
      alunos: alunosComId,
      professores: gravados.map(({ id, nome }) => ({ id, nome }))
    }).findMany;
  });

  afterEach(() => {
    prismaMock.aula.findMany = findManyOriginal;
  });

  const conta = email => gravados.find(usuario => usuario.email === email);

  const entrar = (email, senha = SENHA) =>
    request(app)
      .post('/api/auth/login')
      .set('Origin', Constants.corsOrigins[0])
      .send({ email, senha });

  describe('login (AC-003-014)', () => {
    test.each([
      [EMAIL_ADMIN, 'admin'],
      [EMAIL_PROFESSOR, 'member']
    ])('%s: 200 com token e role %s', async (email, role) => {
      const res = await entrar(email);

      expect(res.status).toBe(200);
      expect(typeof res.body.accessToken).toBe('string');
      expect(res.body.accessToken).not.toBe('');
      expect(parseJwt(res.body.accessToken).payload.role).toBe(role);
    });

    test('o hash gravado difere da senha e é reconhecido por isHash', () => {
      for (const email of [EMAIL_ADMIN, EMAIL_PROFESSOR]) {
        expect(conta(email).senha).not.toBe(SENHA);
        expect(isHash(conta(email).senha)).toBe(true);
      }
    });

    test('controle: senha errada recusa com 401', async () => {
      const res = await entrar(EMAIL_PROFESSOR, 'senha-errada');

      expect(res.status).toBe(401);
      expect(res.body).not.toHaveProperty('accessToken');
    });

    test('controle: sem configuração o mesmo login válido não devolve 200 nem token', async () => {
      configuracoes.mockResolvedValue([]);

      const res = await entrar(EMAIL_PROFESSOR);

      expect(res.status).not.toBe(200);
      expect(res.body).not.toHaveProperty('accessToken');
    });
  });

  describe('agenda', () => {
    const consultar = async (token, inicio, fim) => {
      const res = await request(app)
        .get('/api/aulas')
        .query({ dataInicio: inicio, dataTermino: fim })
        .set('Authorization', `Bearer ${token}`);
      return res;
    };
    const dias = res => res.body.data.map(aula => aula.dataAula.slice(0, 10));
    const distintos = lista => new Set(lista);

    let idProfessor;
    let tokenProfessor;
    let tokenAdmin;
    beforeEach(() => {
      idProfessor = conta(EMAIL_PROFESSOR).id;
      tokenProfessor = tokenDe({ id: idProfessor, role: 'member' });
      tokenAdmin = tokenDe({ id: conta(EMAIL_ADMIN).id, role: 'admin' });
      sessaoAtiva(idProfessor, conta(EMAIL_ADMIN).id);
    });

    const JANELA = ['2026-10-23', '2026-12-25'];

    test('(a) o dia de hoje: 2 aulas, todas no dia e AGENDADA', async () => {
      const res = await consultar(tokenProfessor, '2026-11-20', '2026-11-20');

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(2);
      expect(res.body.data).toHaveLength(2);
      for (const aula of res.body.data) {
        expect(aula.dataAula.startsWith('2026-11-20')).toBe(true);
        expect(aula.status).toBe('AGENDADA');
      }
    });

    test('(b) sábado sem aula: 204 sem corpo', async () => {
      const res = await consultar(tokenProfessor, '2026-11-21', '2026-11-21');

      expect(res.status).toBe(204);
      expect(res.body).toEqual({});
    });

    test('(c) o dia anterior: 2 aulas e nenhuma AGENDADA', async () => {
      const res = await consultar(tokenProfessor, '2026-11-18', '2026-11-18');

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(2);
      for (const aula of res.body.data) {
        expect(aula.dataAula.startsWith('2026-11-18')).toBe(true);
        expect(aula.status).not.toBe('AGENDADA');
      }
    });

    test('(d) as duas semanas passadas: 10 dias, nenhuma AGENDADA', async () => {
      const res = await consultar(tokenProfessor, '2026-11-06', '2026-11-19');

      expect(res.status).toBe(200);
      expect(distintos(dias(res)).size).toBe(10);
      expect(res.body.data.every(aula => aula.status !== 'AGENDADA')).toBe(true);
    });

    test('(e) as quatro semanas futuras: 21 dias, todas AGENDADA, 4 alunos e 1 professor', async () => {
      const res = await consultar(tokenProfessor, '2026-11-20', '2026-12-18');

      expect(res.status).toBe(200);
      expect(distintos(dias(res)).size).toBe(21);
      expect(res.body.data.every(aula => aula.status === 'AGENDADA')).toBe(true);
      expect(distintos(res.body.data.map(aula => aula.aluno.nome)).size).toBe(4);
      expect(distintos(res.body.data.map(aula => aula.professor.nome))).toEqual(
        new Set(['Rafael'])
      );
    });

    test('(f) cada aula aparece no dia pretendido (dia útil) e só nele', async () => {
      const ids = new Set();
      let soma = 0;
      for (const dia of diasDe(...JANELA)) {
        const res = await consultar(tokenProfessor, dia, dia);
        if (res.status === 204) continue;
        expect(res.status).toBe(200);
        for (const aula of res.body.data) {
          expect(aula.dataAula.startsWith(dia)).toBe(true);
          expect(new Date(`${dia}T00:00:00Z`).getUTCDay()).toBeGreaterThanOrEqual(1);
          expect(new Date(`${dia}T00:00:00Z`).getUTCDay()).toBeLessThanOrEqual(5);
          expect(ids.has(aula.id)).toBe(false);
          ids.add(aula.id);
        }
        soma += res.body.count;
      }

      const janela = await consultar(tokenProfessor, ...JANELA);
      expect(soma).toBe(janela.body.count);
      expect(ids.size).toBe(soma);
    });

    test('(g) o professor vê as suas aulas e só elas', async () => {
      const res = await consultar(tokenProfessor, ...JANELA);
      const dele = argumentosAula.filter(aula => aula.idProfessor === idProfessor).length;

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(dele);
      expect(dele).toBeGreaterThan(0);
      expect(res.body.count).toBeLessThan(argumentosAula.length);
    });

    test('o administrador vê as aulas de todos os professores (AC-003-014)', async () => {
      const res = await consultar(tokenAdmin, ...JANELA);
      const doProfessor = await consultar(tokenProfessor, ...JANELA);

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(argumentosAula.length);
      expect(distintos(res.body.data.map(aula => aula.professor.nome)).size).toBe(4);
      expect(doProfessor.body.count).toBeLessThan(res.body.count);
    });
  });
});
