import request from 'supertest';
import { jest } from '@jest/globals';

// InitialSetting.handle() roda no carregamento do app e toca o banco
jest.unstable_mockModule('../../src/InitialSetting.js', () => ({
  InitialSetting: { handle: jest.fn() }
}));

const { default: app } = await import('../../src/app.js');

describe('GET /api/', () => {
  test('responde com status e mensagem, sem a versão do pacote', async () => {
    const res = await request(app).get('/api/');

    expect(res.status).toBe(200);
    expect(Object.keys(res.body).sort()).toEqual(
      ['language', 'message', 'status', 'timestamp', 'uptime'].sort()
    );
    expect(res.body.version).toBeUndefined();
    expect(typeof res.body.status).toBe('string');
    expect(typeof res.body.message).toBe('string');
  });
});
