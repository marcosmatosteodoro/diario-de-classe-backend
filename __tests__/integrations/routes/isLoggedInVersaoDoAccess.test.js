import express from 'express';
import request from 'supertest';
import routes from '../../../src/routes.js';
import Constants from '../../../src/utilities/constants.js';
import { createJwt } from '../../../src/utilities/createJwt.js';
import { tokenDe } from '../../mocks/accessDeTeste.js';
import { sessaoAtiva } from '../../mocks/sessaoAtiva.js';
import ErrorHandler from '../../../src/middlewares/error-handler.js';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.t = key => key;
    next();
  });
  app.use('/api', routes);
  app.use((err, req, res, _next) => ErrorHandler(err, req, res));
  return app;
}

describe('isLoggedIn exige a versão do access (router real)', () => {
  const app = buildApp();

  beforeEach(() => {
    sessaoAtiva('p1');
  });

  test('access legado (admin, sem ver) é 401', async () => {
    const legado = createJwt({ sub: 'a1', role: 'admin' }, Constants.jwtSecret);
    const res = await request(app).get('/api/professores').set('Authorization', `Bearer ${legado}`);
    expect(res.status).toBe(401);
  });

  test('access de ver anterior (2), com sid válido e sessão ativa, é 401', async () => {
    const anterior = tokenDe({
      id: 'p1',
      role: 'professor',
      ver: Constants.accessTokenVersion - 1
    });
    const res = await request(app)
      .get('/api/professores')
      .set('Authorization', `Bearer ${anterior}`);
    expect(res.status).toBe(401);
  });

  test('access novo (professor, ver vigente) passa a autenticação e é 403 em adminOnly', async () => {
    const novo = tokenDe({ id: 'p1', role: 'professor' });
    const res = await request(app).get('/api/professores').set('Authorization', `Bearer ${novo}`);
    expect(res.status).toBe(403);
  });
});
