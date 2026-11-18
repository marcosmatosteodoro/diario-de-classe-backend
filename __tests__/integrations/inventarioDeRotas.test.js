import { jest } from '@jest/globals';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import express from 'express';
import request from 'supertest';
import Constants from '../../src/utilities/constants.js';
import { createJwt } from '../../src/utilities/createJwt.js';
import { base64url } from '../../src/utilities/base64url.js';

const pt = JSON.parse(readFileSync(join(process.cwd(), 'src/locales/pt/translation.json'), 'utf8'));

// O import a frio da árvore de app.js chega perto do testTimeout global (10s).
const TIMEOUT_IMPORT_FRIO = 30000;

const cuid = nome => `c${nome.padEnd(24, '0')}`;
const ID = cuid('registro1');
const ID_PROFESSOR = cuid('professor1');
const ID_ADMIN = cuid('admin1');

const RESTRITA = 'restrita';
const AUTENTICADA = 'autenticada';
const PUBLICA = 'publica';

// Lista declarada: é o contrato de classificação. Toda rota montada precisa estar aqui, e toda
// rota daqui precisa estar montada. `status` é o valor exato esperado: para as restritas, a
// resposta do administrador ao `corpo` mínimo; para as públicas, a resposta do fluxo delas.
const restrita = (verbo, caminho, status) => ({ classe: RESTRITA, verbo, caminho, status });
const autenticada = (verbo, caminho) => ({ classe: AUTENTICADA, verbo, caminho });
const publica = (verbo, caminho, status) => ({ classe: PUBLICA, verbo, caminho, status });

const LISTA = [
  publica('GET', '/api', 200),
  publica('GET', '/api/health', 200),
  publica('POST', '/api/auth/login', 422),
  publica('POST', '/api/auth/logout', 204),
  publica('POST', '/api/auth/refresh-token', 401),

  restrita('GET', '/api/professores', 204),
  restrita('GET', '/api/professores/:id', 200),
  restrita('POST', '/api/professores', 422),
  restrita('PUT', '/api/professores/:id', 200),
  restrita('DELETE', '/api/professores/:id', 204),
  restrita('GET', '/api/professores/:id/aulas', 204),
  restrita('GET', '/api/professores/:id/alunos', 204),
  restrita('GET', '/api/professores/:id/disponibilidade', 204),
  restrita('PUT', '/api/professores/:id/disponibilidade', 422),
  restrita('PUT', '/api/conteudos/:id', 200),
  restrita('DELETE', '/api/conteudos/:id', 204),
  restrita('GET', '/api/relatorios', 200),
  restrita('GET', '/api/relatorios/relatorio-1', 200),
  restrita('POST', '/api/admin/update-nomeCompleto', 200),
  restrita('POST', '/api/alunos/upload', 400),
  restrita('PUT', '/api/configuracao', 422),
  restrita('POST', '/api/contratos', 422),
  restrita('PUT', '/api/contratos/:id', 422),
  restrita('DELETE', '/api/contratos/:id', 204),
  restrita('POST', '/api/contratos/:id/dias-aulas', 422),
  restrita('POST', '/api/contratos/:id/aulas', 422),
  restrita('POST', '/api/contratos/aulas/generate', 422),
  restrita('GET', '/api/contratos/:id/validate', 422),
  restrita('POST', '/api/dias-aulas', 422),
  restrita('PUT', '/api/dias-aulas/:id', 200),
  restrita('DELETE', '/api/dias-aulas/:id', 204),
  restrita('POST', '/api/livros', 422),
  restrita('PUT', '/api/livros/:id', 422),
  restrita('DELETE', '/api/livros/:id', 204),
  restrita('POST', '/api/livros/:id/conteudos', 422),
  restrita('POST', '/api/livros/:id/conteudos/upload', 400),

  autenticada('GET', '/api/dashboard'),
  autenticada('GET', '/api/alunos'),
  autenticada('GET', '/api/alunos/:id'),
  autenticada('POST', '/api/alunos'),
  autenticada('PUT', '/api/alunos/:id'),
  autenticada('DELETE', '/api/alunos/:id'),
  autenticada('GET', '/api/alunos/:id/dias-aulas'),
  autenticada('GET', '/api/alunos/:id/contrato'),
  autenticada('GET', '/api/alunos/:id/contratos'),
  autenticada('GET', '/api/alunos/:id/aulas'),
  autenticada('GET', '/api/alunos/:id/cronograma'),
  autenticada('GET', '/api/alunos/:id/cronograma/excel'),
  autenticada('POST', '/api/alunos/:id/cronograma'),
  autenticada('GET', '/api/alunos/:id/cronogramas'),
  autenticada('GET', '/api/configuracao'),
  autenticada('GET', '/api/contratos'),
  autenticada('GET', '/api/contratos/:id'),
  autenticada('GET', '/api/contratos/:id/dias-aulas'),
  autenticada('GET', '/api/contratos/:id/aulas'),
  autenticada('GET', '/api/dias-aulas'),
  autenticada('GET', '/api/dias-aulas/:id'),
  autenticada('GET', '/api/aulas'),
  autenticada('GET', '/api/aulas/:id'),
  autenticada('POST', '/api/aulas'),
  autenticada('PUT', '/api/aulas/:id'),
  autenticada('DELETE', '/api/aulas/:id'),
  autenticada('PUT', '/api/aulas/:id/andamento'),
  autenticada('PUT', '/api/aulas/:id/conteudo'),
  autenticada('GET', '/api/livros'),
  autenticada('GET', '/api/livros/:id'),
  autenticada('GET', '/api/livros/:id/conteudos'),
  autenticada('PUT', '/api/cronogramas/:id')
];

const chave = ({ verbo, caminho }) => `${verbo} ${caminho}`;
const daClasse = classe => LISTA.filter(rota => rota.classe === classe);
const restritas = daClasse(RESTRITA);
const autenticadas = daClasse(AUTENTICADA);
const publicas = daClasse(PUBLICA);

const urlDe = caminho => caminho.replaceAll(':id', ID);

const tokenDe = ({ id, role }, segredo = Constants.jwtSecret) =>
  createJwt(
    { sub: id, id, email: 'usuario@example.com', role, ver: Constants.accessTokenVersion },
    segredo
  );

const TOKEN_PROFESSOR = tokenDe({ id: ID_PROFESSOR, role: 'professor' });
const TOKEN_ADMIN = tokenDe({ id: ID_ADMIN, role: 'admin' });
const TOKEN_ASSINATURA_ERRADA = tokenDe(
  { id: ID_PROFESSOR, role: 'professor' },
  'outro-segredo-de-teste'
);

// Payload reescrito para admin, assinatura original mantida: a verificação é a única barreira.
const adulteradoParaAdmin = token => {
  const [cabecalho, corpo, assinatura] = token.split('.');
  const payload = JSON.parse(Buffer.from(corpo, 'base64url').toString());
  return `${cabecalho}.${base64url(JSON.stringify({ ...payload, role: 'admin' }))}.${assinatura}`;
};
const TOKEN_ADULTERADO = adulteradoParaAdmin(TOKEN_PROFESSOR);

const bearer = token => `Bearer ${token}`;

const RECUSA_NAO_AUTENTICADO = { error: 'UnauthorizedError', message: pt.api.errors.unauthorized };
const RECUSA_PROIBIDO = { message: pt.api.errors.forbidden };

describe('rotas montadas e autorização de administrador no servidor', () => {
  let app;
  let AbstractRepository;
  let create;
  let update;
  let remove;
  const montagens = new Map();
  const useOriginal = express.Router.prototype.use;

  beforeAll(async () => {
    // Registra o prefixo de cada sub-router montado: a camada do Express 5 não guarda o caminho de `use`.
    express.Router.prototype.use = function (...args) {
      const [primeiro, ...resto] = args;
      const prefixo = typeof primeiro === 'string' ? primeiro : '/';
      for (const fn of (typeof primeiro === 'string' ? resto : args).flat(Infinity)) {
        montagens.set(fn, prefixo);
      }
      return useOriginal.apply(this, args);
    };
    jest.unstable_mockModule('../../src/InitialSetting.js', () => ({
      InitialSetting: { handle: jest.fn() }
    }));
    ({ default: app } = await import('../../src/app.js'));
    ({ default: AbstractRepository } = await import(
      '../../src/repositories/abstractRepository.js'
    ));
    express.Router.prototype.use = useOriginal;
  }, TIMEOUT_IMPORT_FRIO);

  beforeEach(() => {
    jest.spyOn(AbstractRepository.prototype, 'selectOne').mockResolvedValue({ id: ID });
    jest.spyOn(AbstractRepository.prototype, 'selectMany').mockResolvedValue([]);
    create = jest.spyOn(AbstractRepository.prototype, 'create').mockResolvedValue({ id: ID });
    update = jest.spyOn(AbstractRepository.prototype, 'update').mockResolvedValue({ id: ID });
    remove = jest.spyOn(AbstractRepository.prototype, 'delete').mockResolvedValue({ id: ID });
  });

  const semEscrita = () => {
    expect(create).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
  };

  const juntar = (prefixo, caminho) => {
    const completo = `${prefixo}/${caminho}`.replace(/\/+/g, '/');
    return completo.length > 1 ? completo.replace(/\/$/, '') : completo;
  };

  const enumerar = (router, prefixo = '') => {
    const rotas = [];
    for (const camada of router.stack) {
      if (camada.route) {
        if (typeof camada.route.path !== 'string') {
          throw new Error(`caminho de rota não recuperável: ${String(camada.route.path)}`);
        }
        for (const metodo of Object.keys(camada.route.methods)) {
          rotas.push(`${metodo.toUpperCase()} ${juntar(prefixo, camada.route.path)}`);
        }
      } else if (Array.isArray(camada.handle?.stack)) {
        if (!montagens.has(camada.handle)) {
          throw new Error('sub-router montado sem prefixo registrado');
        }
        rotas.push(...enumerar(camada.handle, juntar(prefixo, montagens.get(camada.handle))));
      }
    }
    return rotas;
  };

  const chamar = (rota, { token, corpo, query, cabecalhos } = {}) => {
    let req = request(app)[rota.verbo.toLowerCase()](urlDe(rota.caminho));
    if (token !== undefined) req = req.set('Authorization', token);
    for (const [nome, valor] of Object.entries(cabecalhos ?? {})) req = req.set(nome, valor);
    if (query) req = req.query(query);
    return req.send(corpo ?? {});
  };

  describe('inventário: enumeração e lista declarada', () => {
    test('a lista declarada soma 5 públicas + 31 restritas + 32 autenticadas = 68', () => {
      expect(publicas).toHaveLength(5);
      expect(restritas).toHaveLength(31);
      expect(autenticadas).toHaveLength(32);
      expect(LISTA).toHaveLength(68);
    });

    test('a lista declarada não repete rota', () => {
      expect(new Set(LISTA.map(chave)).size).toBe(LISTA.length);
    });

    test('o inventário das rotas montadas é igual à lista declarada, nos dois sentidos', () => {
      const montadas = enumerar(app.router);
      expect(new Set(montadas).size).toBe(montadas.length);
      expect(montadas.sort()).toEqual(LISTA.map(chave).sort());
    });
  });

  const ORIGEM_PROPRIA = { Origin: Constants.corsOrigins[0] };

  describe('restritas: não-administrador recusado com 403, sem tocar dado (AC-004-020a)', () => {
    const declarandoAdmin = { permissao: 'admin', role: 'admin' };
    const variantes = [
      ['sem declarar permissão', () => ({})],
      ['declarando admin no corpo', () => ({ corpo: declarandoAdmin })],
      ['declarando admin na query', () => ({ query: declarandoAdmin })],
      [
        'declarando admin no cabeçalho x-permissao',
        () => ({ cabecalhos: { 'x-permissao': 'admin' } })
      ]
    ];

    describe.each(variantes)('professor %s', (_nome, opcoes) => {
      test.each(restritas.map(rota => [chave(rota), rota]))('%s → 403', async (_chave, rota) => {
        const res = await chamar(rota, { token: bearer(TOKEN_PROFESSOR), ...opcoes() });

        expect(res.status).toBe(403);
        expect(res.body).toEqual(RECUSA_PROIBIDO);
        semEscrita();
      });
    });
  });

  describe('restritas: credencial adulterada recusada como não autenticada (AC-004-020b)', () => {
    test.each(restritas.map(rota => [chave(rota), rota]))('%s → 401', async (_chave, rota) => {
      const res = await chamar(rota, { token: bearer(TOKEN_ADULTERADO) });

      expect(res.status).toBe(401);
      expect(res.body).toEqual(RECUSA_NAO_AUTENTICADO);
      semEscrita();
    });
  });

  describe('restritas: o administrador é aceito com o status exato da lista (AC-004-021)', () => {
    test.each(restritas.map(rota => [chave(rota), rota]))('%s', async (_chave, rota) => {
      const res = await chamar(rota, { token: bearer(TOKEN_ADMIN) });

      expect(res.status).toBe(rota.status);
    });

    test('POST /api/livros do administrador cria exatamente um registro', async () => {
      AbstractRepository.prototype.selectOne.mockResolvedValue(null);

      const res = await chamar(
        { verbo: 'POST', caminho: '/api/livros' },
        { token: bearer(TOKEN_ADMIN), corpo: { nome: 'Livro de teste', idioma: 'INGLES' } }
      );

      expect(res.status).toBe(201);
      expect(create).toHaveBeenCalledTimes(1);
      expect(update).not.toHaveBeenCalled();
      expect(remove).not.toHaveBeenCalled();
    });

    test('PUT /api/dias-aulas/:id do administrador atualiza exatamente um registro', async () => {
      const res = await chamar(
        { verbo: 'PUT', caminho: '/api/dias-aulas/:id' },
        { token: bearer(TOKEN_ADMIN) }
      );

      expect(res.status).toBe(200);
      expect(update).toHaveBeenCalledTimes(1);
      expect(create).not.toHaveBeenCalled();
      expect(remove).not.toHaveBeenCalled();
    });

    test('DELETE /api/livros/:id do administrador remove exatamente um registro', async () => {
      const res = await chamar(
        { verbo: 'DELETE', caminho: '/api/livros/:id' },
        { token: bearer(TOKEN_ADMIN) }
      );

      expect(res.status).toBe(204);
      expect(remove).toHaveBeenCalledTimes(1);
      expect(create).not.toHaveBeenCalled();
      expect(update).not.toHaveBeenCalled();
    });
  });

  describe('autenticadas: o professor não é barrado como administrador (classificação)', () => {
    test.each(autenticadas.map(rota => [chave(rota), rota]))(
      '%s não responde 401 nem 403',
      async (_chave, rota) => {
        const res = await chamar(rota, { token: bearer(TOKEN_PROFESSOR) });

        expect([401, 403]).not.toContain(res.status);
      }
    );
  });

  describe('sem credencial válida (AC-004-022)', () => {
    const credenciais = [
      ['sem Authorization', undefined],
      ['Authorization sem o prefixo Bearer', TOKEN_ADMIN],
      ['Bearer com assinatura errada', bearer(TOKEN_ASSINATURA_ERRADA)]
    ];

    describe.each(credenciais)('%s', (_nome, token) => {
      test.each([...restritas, ...autenticadas].map(rota => [chave(rota), rota]))(
        '%s → 401',
        async (_chave, rota) => {
          const res = await chamar(rota, { token });

          expect(res.status).toBe(401);
          expect(res.body).toEqual(RECUSA_NAO_AUTENTICADO);
          semEscrita();
        }
      );
    });

    test.each(publicas.map(rota => [chave(rota), rota]))(
      'pública %s responde o status do fluxo dela, sem passar pelo isLoggedIn',
      async (_chave, rota) => {
        const res = await chamar(rota, { cabecalhos: ORIGEM_PROPRIA });

        expect(res.status).toBe(rota.status);
        expect(res.body).not.toEqual(RECUSA_NAO_AUTENTICADO);
      }
    );
  });
});
