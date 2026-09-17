import { describe, test, expect } from '@jest/globals';
import express from 'express';
import request from 'supertest';

import cleanRequest from '../../../src/middlewares/cleanRequest.js';
import { validateSearchQuery } from '../../../src/middlewares/validateSearchQuery.js';

// BI-36: no Express 5, req.query é um getter sem cache (reparseia req.url a cada
// acesso, devolvendo um objeto novo). Este teste bate numa instância real do
// Express — sem mock de req/res — para provar que o trim aplicado por
// validateSearchQuery sobrevive até o handler final, exatamente na cadeia de
// middlewares usada em produção (cleanRequest é global em src/app.js, antes das
// rotas; validateSearchQuery é aplicado por rota).
const buildApp = () => {
  const app = express();
  app.use(cleanRequest);
  app.get('/livros', validateSearchQuery, (req, res) => {
    res.status(200).json({ query: req.query });
  });
  return app;
};

describe('cleanRequest + validateSearchQuery (integração via Express real)', () => {
  test('q com espaço nas pontas chega trimado ao handler final', async () => {
    const app = buildApp();

    const response = await request(app).get('/livros').query({ q: ' Alice ' });

    expect(response.status).toBe(200);
    expect(response.body.query.q).toBe('Alice');
  });

  test('demais parâmetros da query sobrevivem junto com o q trimado', async () => {
    const app = buildApp();

    const response = await request(app).get('/livros').query({ q: '  English  ', page: '2' });

    expect(response.status).toBe(200);
    expect(response.body.query).toEqual({ q: 'English', page: '2' });
  });

  test('q ausente continua não aparecendo na query do handler final', async () => {
    const app = buildApp();

    const response = await request(app).get('/livros').query({ page: '1' });

    expect(response.status).toBe(200);
    expect(response.body.query).toEqual({ page: '1' });
  });
});
