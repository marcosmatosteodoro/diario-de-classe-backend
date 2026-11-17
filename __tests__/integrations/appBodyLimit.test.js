import request from 'supertest';
import { jest } from '@jest/globals';

// InitialSetting.handle() roda no carregamento do app e toca o banco
jest.unstable_mockModule('../../src/InitialSetting.js', () => ({
  InitialSetting: { handle: jest.fn() }
}));

const { default: app, BODY_LIMIT } = await import('../../src/app.js');

const ONE_MB = 1024 * 1024;

function buildAulas(quantidade, observacao) {
  return Array.from({ length: quantidade }, (_, i) => ({
    dataAula: new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10),
    horaInicial: '10:00',
    horaFinal: '11:00',
    tipo: 'normal',
    ...(observacao ? { observacao } : {})
  }));
}

function buildPayload(aulas) {
  return {
    idAluno: 'clh4d6j8h0000kc1j5v3m2n4o',
    idProfessor: 'clh4d6j8h0001kc1j5v3m2n4o',
    aulas
  };
}

describe('app.js montado - limite do corpo da requisição', () => {
  test('o limite configurado é 1mb', () => {
    expect(BODY_LIMIT).toBe('1mb');
  });

  test('JSON acima de 1mb responde 413 PayloadTooLarge', async () => {
    const body = JSON.stringify({ texto: 'a'.repeat(ONE_MB + 1024) });

    const response = await request(app)
      .post('/api/health')
      .set('Content-Type', 'application/json')
      .send(body);

    expect(response.status).toBe(413);
    expect(response.body.error).toBe('PayloadTooLarge');
    expect(response.body.message).toBe('Corpo da requisição excede o tamanho permitido');
    expect(JSON.stringify(response.body)).not.toContain('aaaa');
  });

  test('urlencoded acima de 1mb responde 413', async () => {
    const body = `texto=${'a'.repeat(ONE_MB + 1024)}`;

    const response = await request(app)
      .post('/api/health')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send(body);

    expect(response.status).toBe(413);
    expect(response.body.error).toBe('PayloadTooLarge');
  });

  test('JSON logo abaixo de 1mb não recebe 413', async () => {
    const body = JSON.stringify({ texto: 'a'.repeat(ONE_MB - 1024) });

    const response = await request(app)
      .post('/api/health')
      .set('Content-Type', 'application/json')
      .send(body);

    expect(response.status).not.toBe(413);
  });

  test('lote de 1800 aulas sem observação não recebe 413', async () => {
    const body = JSON.stringify(buildPayload(buildAulas(1800)));
    console.info(`payload 1800 aulas sem observacao: ${Buffer.byteLength(body)} bytes`);

    const response = await request(app)
      .post('/api/health')
      .set('Content-Type', 'application/json')
      .send(body);

    expect(Buffer.byteLength(body)).toBeLessThan(ONE_MB);
    expect(response.status).not.toBe(413);
    expect(response.status).not.toBe(400);
  });

  test('lote de 1800 aulas com observação de 1000 caracteres em parte delas não recebe 413', async () => {
    const aulas = buildAulas(1800);
    const comObservacao = buildAulas(500, 'o'.repeat(1000));
    const payload = buildPayload([...comObservacao, ...aulas.slice(500)]);
    const body = JSON.stringify(payload);
    console.info(`payload 1800 aulas, 500 com observacao: ${Buffer.byteLength(body)} bytes`);

    const response = await request(app)
      .post('/api/health')
      .set('Content-Type', 'application/json')
      .send(body);

    expect(Buffer.byteLength(body)).toBeLessThan(ONE_MB);
    expect(response.status).not.toBe(413);
    expect(response.status).not.toBe(400);
  });

  test('JSON malformado responde 400 e não 500', async () => {
    const response = await request(app)
      .post('/api/health')
      .set('Content-Type', 'application/json')
      .send('{"texto": ');

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('BadRequest');
  });
});
