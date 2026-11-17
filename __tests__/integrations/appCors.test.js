import { jest } from '@jest/globals';
import request from 'supertest';

// O import a frio da árvore de app.js chega perto do testTimeout global (10s).
const TIMEOUT_IMPORT_FRIO = 30000;

const ORIGEM_LISTADA = 'https://app.example.com';
const SEGUNDA_ORIGEM = 'http://localhost:3001';
const ORIGEM_NAO_LISTADA = 'https://evil.example.com';

describe('CORS montado pelo app.js (integração)', () => {
  let app;
  const envOriginal = process.env.CORS_ORIGINS;

  beforeAll(async () => {
    jest.resetModules();
    process.env.CORS_ORIGINS = `${ORIGEM_LISTADA},${SEGUNDA_ORIGEM}`;
    jest.unstable_mockModule('../../src/InitialSetting.js', () => ({
      InitialSetting: { handle: jest.fn() }
    }));
    ({ default: app } = await import('../../src/app.js?cors'));
  }, TIMEOUT_IMPORT_FRIO);

  afterAll(() => {
    if (envOriginal === undefined) delete process.env.CORS_ORIGINS;
    else process.env.CORS_ORIGINS = envOriginal;
  });

  const preflight = origem =>
    request(app)
      .options('/api/auth/login')
      .set('Origin', origem)
      .set('Access-Control-Request-Method', 'POST');

  test('preflight de origem listada devolve a origem, os métodos e nenhuma credencial', async () => {
    const res = await preflight(ORIGEM_LISTADA);

    expect(res.status).toBe(204);
    expect(res.headers['access-control-allow-origin']).toBe(ORIGEM_LISTADA);
    expect(res.headers['access-control-allow-methods']).toBe('GET,POST,PUT,DELETE');
    expect(res.headers['access-control-allow-credentials']).toBeUndefined();
  });

  test('preflight da segunda origem da lista também é aceito', async () => {
    const res = await preflight(SEGUNDA_ORIGEM);

    expect(res.status).toBe(204);
    expect(res.headers['access-control-allow-origin']).toBe(SEGUNDA_ORIGEM);
  });

  test('preflight de origem não listada não recebe Access-Control-Allow-Origin', async () => {
    const res = await preflight(ORIGEM_NAO_LISTADA);

    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  test('GET de origem listada recebe Access-Control-Allow-Origin igual à origem', async () => {
    const res = await request(app).get('/api/rota-inexistente').set('Origin', ORIGEM_LISTADA);

    expect(res.status).toBe(404);
    expect(res.headers['access-control-allow-origin']).toBe(ORIGEM_LISTADA);
  });

  test('GET de origem não listada não recebe Access-Control-Allow-Origin', async () => {
    const res = await request(app).get('/api/rota-inexistente').set('Origin', ORIGEM_NAO_LISTADA);

    expect(res.status).toBe(404);
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
});
