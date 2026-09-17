import express from 'express';
import request from 'supertest';
import { jest } from '@jest/globals';
import contratoRouter from '../../../src/routes/contratoRouter.js';
import { GetContratoListService } from '../../../src/services/contrato/getContratoListService.js';

jest.mock('../../../src/services/contrato/getContratoListService.js');

describe('GET /contratos - validateSearchQuery (router real)', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use((req, res, next) => {
      req.user = { id: 'user-1', isAdmin: true };
      next();
    });
    app.use('/contratos', contratoRouter);

    GetContratoListService.handle = jest.fn().mockResolvedValue([]);
  });

  test('q acima do limite retorna 400 e nunca chega ao service', async () => {
    const response = await request(app)
      .get('/contratos')
      .query({ q: 'a'.repeat(201) });

    expect(response.status).toBe(400);
    expect(response.body.field).toBe('q');
    expect(GetContratoListService.handle).not.toHaveBeenCalled();
  });

  test('q dentro do limite chega ao controller/service normalmente', async () => {
    const response = await request(app).get('/contratos').query({ q: 'Maria' });

    expect(response.status).toBe(204);
    expect(GetContratoListService.handle).toHaveBeenCalledTimes(1);
  });

  test('sem q nenhum, passa direto para o controller/service', async () => {
    const response = await request(app).get('/contratos');

    expect(response.status).toBe(204);
    expect(GetContratoListService.handle).toHaveBeenCalledTimes(1);
  });
});
