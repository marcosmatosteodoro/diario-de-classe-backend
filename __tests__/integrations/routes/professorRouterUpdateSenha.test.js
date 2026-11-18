import express from 'express';
import request from 'supertest';
import { jest } from '@jest/globals';
import routes from '../../../src/routes.js';
import Constants from '../../../src/utilities/constants.js';
import { createJwt } from '../../../src/utilities/createJwt.js';
import AbstractRepository from '../../../src/repositories/abstractRepository.js';
import { GetUserService } from '../../../src/services/user/getUserService.js';
import { IsUserEmailExistsService } from '../../../src/services/user/isUserEmailExistsService.js';

const PROFESSOR_ID = 'clh4d6j8h0000kc1j5v3m2n4o';

const registroExistente = {
  id: PROFESSOR_ID,
  nome: 'João',
  sobrenome: 'Silva',
  email: 'joao@teste.com',
  telefone: '11999999999',
  permissao: 'member',
  idiomas: []
};

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.t = key => key;
    next();
  });
  // Router real de src/routes.js: a guarda de autorização (`isLoggedIn, adminOnly`)
  // que protege `/professores` mora ali (routes.js:28), não em `userRouter`.
  app.use('/', routes);
  return app;
}

function bearerToken({ sub, role }) {
  return `Bearer ${createJwt({ sub, role, ver: Constants.accessTokenVersion }, Constants.jwtSecret)}`;
}

describe('PUT /professores/:id (router real de src/routes.js) - guarda de senha e autorização', () => {
  let app;
  let updateSpy;

  beforeEach(() => {
    app = buildApp();

    updateSpy = jest
      .spyOn(AbstractRepository.prototype, 'update')
      .mockResolvedValue({ ...registroExistente });

    GetUserService.handle = jest.fn().mockResolvedValue({ ...registroExistente });
    IsUserEmailExistsService.handle = jest.fn().mockResolvedValue(false);
  });

  test('(a) admin autenticado por JWT real com senha vazia: data capturado pelo update não tem a chave senha (AC-001-011)', async () => {
    const response = await request(app)
      .put(`/professores/${PROFESSOR_ID}`)
      .set('Authorization', bearerToken({ sub: 'admin-1', role: 'admin' }))
      .send({
        nome: 'João',
        sobrenome: 'Silva',
        email: 'joao@teste.com',
        telefone: '11999999999',
        senha: '',
        permissao: 'member'
      });

    expect(response.status).toBe(200);
    expect(updateSpy).toHaveBeenCalledTimes(1);

    const [, data] = updateSpy.mock.calls[0];
    expect(data).not.toHaveProperty('senha');
  });

  test('(b) não-admin autenticado por JWT real sobre registro de terceiro com senha preenchida: 403 e update nunca chamado (AC-001-014)', async () => {
    const response = await request(app)
      .put(`/professores/${PROFESSOR_ID}`)
      .set('Authorization', bearerToken({ sub: 'terceiro-1', role: 'member' }))
      .send({
        nome: 'João',
        email: 'joao@teste.com',
        senha: 'novaSenhaPreenchida123'
      });

    expect(response.status).toBe(403);
    expect(updateSpy).not.toHaveBeenCalled();
  });
});
