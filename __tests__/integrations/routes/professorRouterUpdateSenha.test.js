import express from 'express';
import request from 'supertest';
import { jest } from '@jest/globals';
import adminOnly from '../../../src/middlewares/adminOnly.js';
import userRouter from '../../../src/routes/userRouter.js';
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

function buildApp(user) {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.user = user;
    req.t = key => key;
    next();
  });
  app.use(adminOnly);
  app.use('/professores', userRouter);
  return app;
}

describe('PUT /professores/:id (router real) - guarda de senha e autorização', () => {
  let updateSpy;

  beforeEach(() => {
    updateSpy = jest
      .spyOn(AbstractRepository.prototype, 'update')
      .mockResolvedValue({ ...registroExistente });

    GetUserService.handle = jest.fn().mockResolvedValue({ ...registroExistente });
    IsUserEmailExistsService.handle = jest.fn().mockResolvedValue(false);
  });

  test('(a) admin com senha vazia: data capturado pelo update não tem a chave senha (AC-001-011)', async () => {
    const app = buildApp({ id: 'admin-1', isAdmin: true });

    const response = await request(app).put(`/professores/${PROFESSOR_ID}`).send({
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

  test('(b) não-admin sobre registro de terceiro com senha preenchida: 403 e update nunca chamado (AC-001-014)', async () => {
    const app = buildApp({ id: 'terceiro-1', isAdmin: false });

    const response = await request(app).put(`/professores/${PROFESSOR_ID}`).send({
      nome: 'João',
      email: 'joao@teste.com',
      senha: 'novaSenhaPreenchida123'
    });

    expect(response.status).toBe(403);
    expect(updateSpy).not.toHaveBeenCalled();
  });
});
