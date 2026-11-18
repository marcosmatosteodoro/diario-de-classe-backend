import { jest } from '@jest/globals';
import request from 'supertest';
import Constants from '../../src/utilities/constants.js';
import { cuid, tokenDe } from '../mocks/accessDeTeste.js';
import { sessaoAtiva } from '../mocks/sessaoAtiva.js';

// O import a frio da árvore de app.js chega perto do testTimeout global (10s).
const TIMEOUT_IMPORT_FRIO = 30000;

const SOLICITANTE = cuid('professor1');
const OUTRO_DONO = cuid('professor2');
const ID_PROPRIO = cuid('registro1');
const ID_ALHEIO = cuid('registro2');

const REGISTRO_PROPRIO = { id: ID_PROPRIO, email: 'proprio@example.com', dono: SOLICITANTE };
const REGISTRO_ALHEIO = { id: ID_ALHEIO, email: 'alheio@example.com', dono: OUTRO_DONO };

const bearerDe = (dados, segredo = Constants.jwtSecret) => `Bearer ${tokenDe(dados, segredo)}`;

const TOKEN_PROFESSOR = bearerDe({ id: SOLICITANTE, role: 'professor' });
const ID_ADMIN = cuid('admin1');
const TOKEN_ADMIN = bearerDe({ id: ID_ADMIN, role: 'admin' });
const TOKEN_SEGREDO_ERRADO = bearerDe(
  { id: SOLICITANTE, role: 'professor' },
  'segredo-que-nao-e-o-do-ambiente'
);

// Cláusulas de posse esperadas no `where` que chega ao acesso a dado, por domínio.
const posseAluno = id => [{ aulas: { some: { idProfessor: id } } }, { criador: id }];
const posseDiaAula = id => ({ aluno: { OR: posseAluno(id) } });
const posseAula = id => ({ idProfessor: id });
const posseContrato = id => ({ aulas: { some: { idProfessor: id } } });

const buscaAluno = q =>
  ['nomeCompleto', 'nome', 'sobrenome', 'email', 'telefone'].map(campo => ({
    [campo]: { contains: q }
  }));

// Uma consulta "vê" a posse do solicitante quando o filtro recebido a carrega literalmente.
const filtroTemPosse = (where, trecho) => JSON.stringify(where ?? {}).includes(trecho);

const TRECHO_POSSE = {
  Aluno: JSON.stringify(posseAluno(SOLICITANTE)),
  Aula: JSON.stringify(posseAula(SOLICITANTE)).slice(1, -1),
  Contrato: JSON.stringify(posseContrato(SOLICITANTE)).slice(1, -1),
  DiaAula: JSON.stringify(posseDiaAula(SOLICITANTE)).slice(1, -1)
};

describe('Negação de acesso pelo app.js real (integração)', () => {
  let app;
  let AbstractRepository;
  let selectOne;
  let selectMany;
  let update;
  let remove;
  let create;

  beforeEach(() => {
    sessaoAtiva(SOLICITANTE, ID_ADMIN);
  });

  beforeAll(async () => {
    jest.unstable_mockModule('../../src/InitialSetting.js', () => ({
      InitialSetting: { handle: jest.fn() }
    }));
    ({ default: app } = await import('../../src/app.js'));
    ({ default: AbstractRepository } = await import(
      '../../src/repositories/abstractRepository.js'
    ));
  }, TIMEOUT_IMPORT_FRIO);

  // Banco simulado com dois registros do modelo alvo, um do solicitante e um de outro dono:
  // o registro alheio só é devolvido quando o filtro recebido não carrega a posse do solicitante,
  // como faria um banco consultado sem a restrição. Os demais modelos respondem vazio.
  const simularBanco = modelo => {
    const alvo = function () {
      return this.entity.name === modelo;
    };
    const visiveis = where =>
      filtroTemPosse(where, TRECHO_POSSE[modelo])
        ? [REGISTRO_PROPRIO]
        : [REGISTRO_PROPRIO, REGISTRO_ALHEIO];

    selectOne = jest
      .spyOn(AbstractRepository.prototype, 'selectOne')
      .mockImplementation(async function ({ where }) {
        if (!alvo.call(this) || !where?.id) return null;
        return visiveis(where).find(registro => registro.id === where.id) ?? null;
      });
    selectMany = jest
      .spyOn(AbstractRepository.prototype, 'selectMany')
      .mockImplementation(async function ({ where } = {}) {
        return alvo.call(this) ? visiveis(where) : [];
      });
    update = jest
      .spyOn(AbstractRepository.prototype, 'update')
      .mockImplementation(async (where, data) => ({ ...REGISTRO_PROPRIO, ...data }));
    remove = jest.spyOn(AbstractRepository.prototype, 'delete').mockResolvedValue({});
    create = jest.spyOn(AbstractRepository.prototype, 'create').mockResolvedValue({});
  };

  const whereRecebidoPor = spy => spy.mock.calls[0][0].where;
  const semAcessoADados = () => {
    expect(selectOne).not.toHaveBeenCalled();
    expect(selectMany).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  };

  describe('autenticação: sem token ou com assinatura inválida a rota nega com 401', () => {
    const rotas = ['/api/alunos', '/api/aulas', '/api/contratos', '/api/dias-aulas'];

    beforeEach(() => simularBanco('Aluno'));

    test.each(rotas)('GET %s sem token → 401 e nenhum acesso a dado', async rota => {
      const res = await request(app).get(rota);

      expect(res.status).toBe(401);
      semAcessoADados();
    });

    test.each(rotas)(
      'GET %s com token de outro segredo → 401 e nenhum acesso a dado',
      async rota => {
        const res = await request(app).get(rota).set('Authorization', TOKEN_SEGREDO_ERRADO);

        expect(res.status).toBe(401);
        semAcessoADados();
      }
    );

    test.each(rotas)(
      'GET %s com token válido passa da autenticação e consulta o banco',
      async rota => {
        const res = await request(app).get(rota).set('Authorization', TOKEN_PROFESSOR);

        expect(res.status).not.toBe(401);
        expect(selectMany).toHaveBeenCalled();
      }
    );
  });

  describe.each([
    {
      dominio: 'aluno',
      modelo: 'Aluno',
      base: '/api/alunos',
      posse: posseAluno,
      whereComPosse: id => ({ OR: posseAluno(id) }),
      whereComBusca: (id, q) => ({ AND: [{ OR: posseAluno(id) }, { OR: buscaAluno(q) }] })
    },
    {
      dominio: 'aula',
      modelo: 'Aula',
      base: '/api/aulas',
      whereComPosse: id => posseAula(id),
      whereComBusca: (id, q) => ({
        ...posseAula(id),
        OR: [
          { aluno: { nome: { contains: q, mode: 'insensitive' } } },
          { professor: { nome: { contains: q, mode: 'insensitive' } } }
        ]
      })
    },
    {
      dominio: 'contrato',
      modelo: 'Contrato',
      base: '/api/contratos',
      whereComPosse: id => posseContrato(id),
      whereComBusca: (id, q) => ({
        ...posseContrato(id),
        OR: [{ aluno: { nome: { contains: q, mode: 'insensitive' } } }]
      })
    },
    {
      dominio: 'diaAula',
      modelo: 'DiaAula',
      base: '/api/dias-aulas',
      whereComPosse: id => posseDiaAula(id),
      whereComBusca: (id, q) => ({
        ...posseDiaAula(id),
        OR: ['diaSemana', 'quantidadeAulas', 'horaInicial', 'horaFinal'].map(campo => ({
          [campo]: { contains: q }
        }))
      })
    }
  ])('posse em $dominio', ({ modelo, base, whereComPosse, whereComBusca }) => {
    beforeEach(() => simularBanco(modelo));

    test('professor lista só o que é seu, sem busca, com a posse no filtro recebido', async () => {
      const res = await request(app).get(base).set('Authorization', TOKEN_PROFESSOR);

      expect(whereRecebidoPor(selectMany)).toEqual(whereComPosse(SOLICITANTE));
      expect(res.status).toBe(200);
      expect(res.body.data.map(registro => registro.id)).toEqual([ID_PROPRIO]);
      expect(JSON.stringify(res.body)).not.toContain(ID_ALHEIO);
    });

    test('professor lista só o que é seu, com busca, e a busca não substitui a posse', async () => {
      const res = await request(app).get(`${base}?q=maria`).set('Authorization', TOKEN_PROFESSOR);

      expect(whereRecebidoPor(selectMany)).toEqual(whereComBusca(SOLICITANTE, 'maria'));
      expect(res.status).toBe(200);
      expect(res.body.data.map(registro => registro.id)).toEqual([ID_PROPRIO]);
      expect(JSON.stringify(res.body)).not.toContain(ID_ALHEIO);
    });

    test('administrador lista sem restrição de posse (controle positivo da listagem)', async () => {
      const res = await request(app).get(base).set('Authorization', TOKEN_ADMIN);

      expect(res.status).toBe(200);
      expect(res.body.data.map(registro => registro.id)).toEqual([ID_PROPRIO, ID_ALHEIO]);
    });

    test('professor não lê o registro de outro dono: 404', async () => {
      const res = await request(app)
        .get(`${base}/${ID_ALHEIO}`)
        .set('Authorization', TOKEN_PROFESSOR);

      expect(selectOne).toHaveBeenCalledTimes(1);
      expect(whereRecebidoPor(selectOne)).toEqual({
        id: ID_ALHEIO,
        ...whereComPosse(SOLICITANTE)
      });
      expect(res.status).toBe(404);
      expect(JSON.stringify(res.body)).not.toContain(REGISTRO_ALHEIO.email);
    });

    test('professor lê o próprio registro: 200 (controle positivo)', async () => {
      const res = await request(app)
        .get(`${base}/${ID_PROPRIO}`)
        .set('Authorization', TOKEN_PROFESSOR);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(ID_PROPRIO);
    });

    test('administrador lê o registro de qualquer dono: 200 (controle positivo)', async () => {
      const res = await request(app).get(`${base}/${ID_ALHEIO}`).set('Authorization', TOKEN_ADMIN);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(ID_ALHEIO);
    });
  });

  describe.each([
    {
      dominio: 'aluno',
      modelo: 'Aluno',
      base: '/api/alunos',
      whereComPosse: id => ({ OR: posseAluno(id) }),
      corpo: { email: 'alheio@example.com' }
    },
    {
      dominio: 'aula',
      modelo: 'Aula',
      base: '/api/aulas',
      whereComPosse: id => posseAula(id),
      corpo: { observacao: 'observação de teste' }
    }
  ])(
    'escrita em $dominio por professor que não é o dono',
    ({ modelo, base, whereComPosse, corpo }) => {
      beforeEach(() => simularBanco(modelo));

      test('professor não altera o registro de outro dono: 404 e nada é escrito', async () => {
        const res = await request(app)
          .put(`${base}/${ID_ALHEIO}`)
          .set('Authorization', TOKEN_PROFESSOR)
          .send(corpo);

        expect(res.status).toBe(404);
        expect(selectOne).toHaveBeenCalledTimes(1);
        expect(whereRecebidoPor(selectOne)).toEqual({
          id: ID_ALHEIO,
          ...whereComPosse(SOLICITANTE)
        });
        expect(update).not.toHaveBeenCalled();
      });

      test('professor altera o próprio registro: 200 e a escrita chega ao repositório (controle positivo)', async () => {
        const res = await request(app)
          .put(`${base}/${ID_PROPRIO}`)
          .set('Authorization', TOKEN_PROFESSOR)
          .send({ ...corpo, email: REGISTRO_PROPRIO.email });

        expect(res.status).toBe(200);
        // Aula dispara uma 2ª escrita (recálculo do contrato); a 1ª é a do registro.
        expect(update).toHaveBeenCalled();
        expect(update.mock.calls[0][0]).toEqual({ id: ID_PROPRIO });
      });
    }
  );

  describe.each([
    {
      dominio: 'contrato',
      modelo: 'Contrato',
      base: '/api/contratos',
      corpoPut: { observacao: 'observação de teste' },
      statusAdminPut: 422,
      statusAdminPost: 422
    },
    {
      dominio: 'diaAula',
      modelo: 'DiaAula',
      base: '/api/dias-aulas',
      corpoPut: { quantidadeAulas: 2 },
      // Sem configuração de duração no banco simulado o PUT chega ao controller e falha ali.
      statusAdminPut: 500,
      statusAdminPost: 422
    }
  ])(
    'escrita em $dominio é restrita a administrador',
    ({ modelo, base, corpoPut, statusAdminPut, statusAdminPost }) => {
      const corpoPost = {
        idAluno: cuid('aluno1'),
        idContrato: cuid('contrato1'),
        diaSemana: 'SEGUNDA',
        quantidadeAulas: 1,
        horaInicial: '10:00'
      };

      beforeEach(() => simularBanco(modelo));

      test('professor em PUT /:id → 403 e nenhum acesso a dado', async () => {
        const res = await request(app)
          .put(`${base}/${ID_PROPRIO}`)
          .set('Authorization', TOKEN_PROFESSOR)
          .send(corpoPut);

        expect(res.status).toBe(403);
        semAcessoADados();
      });

      test('professor em POST / → 403 e nenhum acesso a dado', async () => {
        const res = await request(app)
          .post(base)
          .set('Authorization', TOKEN_PROFESSOR)
          .send(corpoPost);

        expect(res.status).toBe(403);
        semAcessoADados();
      });

      test('professor em DELETE /:id → 403 e nenhum acesso a dado', async () => {
        const res = await request(app)
          .delete(`${base}/${ID_PROPRIO}`)
          .set('Authorization', TOKEN_PROFESSOR);

        expect(res.status).toBe(403);
        semAcessoADados();
      });

      test('administrador em PUT /:id passa da restrição (controle positivo)', async () => {
        const res = await request(app)
          .put(`${base}/${ID_PROPRIO}`)
          .set('Authorization', TOKEN_ADMIN)
          .send(corpoPut);

        expect(res.status).toBe(statusAdminPut);
      });

      test('administrador em POST / passa da restrição (controle positivo)', async () => {
        const res = await request(app).post(base).set('Authorization', TOKEN_ADMIN).send(corpoPost);

        expect(res.status).toBe(statusAdminPost);
      });
    }
  );

  describe('aula: o filtro por professor da query não troca a posse do solicitante', () => {
    beforeEach(() => simularBanco('Aula'));

    test('professor lista com ?idProfessor=<outro>: o filtro recebido segue com a posse dele', async () => {
      const res = await request(app)
        .get(`/api/aulas?idProfessor=${OUTRO_DONO}`)
        .set('Authorization', TOKEN_PROFESSOR);

      expect(res.status).toBe(200);
      expect(whereRecebidoPor(selectMany)).toEqual(posseAula(SOLICITANTE));
      expect(JSON.stringify(res.body)).not.toContain(ID_ALHEIO);
    });

    test('administrador lista com ?idProfessor=<outro>: o filtro é aplicado (controle positivo)', async () => {
      await request(app)
        .get(`/api/aulas?idProfessor=${OUTRO_DONO}`)
        .set('Authorization', TOKEN_ADMIN);

      expect(whereRecebidoPor(selectMany)).toEqual({ idProfessor: OUTRO_DONO });
    });
  });

  describe('controles dos spies de escrita: o acesso a dado simulado registra as chamadas', () => {
    test('administrador remove um dia de aula: o spy de remoção é chamado', async () => {
      simularBanco('DiaAula');

      const res = await request(app)
        .delete(`/api/dias-aulas/${ID_PROPRIO}`)
        .set('Authorization', TOKEN_ADMIN);

      expect(res.status).toBe(204);
      expect(remove).toHaveBeenCalledTimes(1);
    });

    test('administrador cria um aluno: o spy de criação é chamado', async () => {
      simularBanco('Aluno');

      const res = await request(app)
        .post('/api/alunos')
        .set('Authorization', TOKEN_ADMIN)
        .send({ nome: 'Maria', sobrenome: 'Souza', email: 'novo@example.com' });

      expect(res.status).toBe(201);
      expect(create).toHaveBeenCalledTimes(1);
    });
  });
});
