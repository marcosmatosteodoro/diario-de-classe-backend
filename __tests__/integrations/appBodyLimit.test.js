import request from 'supertest';
import { jest } from '@jest/globals';

// InitialSetting.handle() roda no carregamento do app e toca o banco
jest.unstable_mockModule('../../src/InitialSetting.js', () => ({
  InitialSetting: { handle: jest.fn() }
}));

const { default: app } = await import('../../src/app.js');

const MB = 1024 * 1024;
const LIMITE = 3 * MB;
const TOTAL_AULAS = 1800;
const CUID = 'clh4d6j8h0000kc1j5v3m2n4o';

// Aula no formato do GET /api/contratos/:id (contratoRepository: campos selecionados + professor)
function aulaFormatoGet(i, observacao) {
  const data = new Date(Date.UTC(2026, 0, 1) + i * 86400000).toISOString();
  return {
    id: 'clh4d6j8h0002kc1j5v3m2n4o',
    idAluno: CUID,
    idProfessor: CUID,
    idContrato: CUID,
    dataAula: data,
    horaInicial: '10:00',
    horaFinal: '11:00',
    duracaoAula: 60,
    tipo: 'PADRAO',
    status: 'PENDENTE',
    observacao: observacao ?? null,
    dataCriacao: data,
    dataAtualizacao: data,
    professor: { nome: 'Fulano', nomeCompleto: 'Fulano de Tal da Silva' }
  };
}

// Aula no formato de POST /api/contratos/aulas/generate (aulaPrepare)
function aulaFormatoGenerate(i) {
  return {
    dataAula: new Date(Date.UTC(2026, 0, 1) + i * 86400000).toISOString(),
    horaInicial: '10:00',
    horaFinal: '11:00',
    tipo: 'PADRAO',
    duracaoAula: 60,
    idProfessor: CUID,
    professor: { id: CUID, nomeCompleto: 'Fulano de Tal da Silva', nome: 'Fulano' },
    observacao: null
  };
}

function contrato(aulas) {
  return {
    idAluno: CUID,
    idProfessor: CUID,
    dataInicio: '2026-01-01',
    dataTermino: '2031-01-01',
    idioma: 'INGLES',
    status: 'ATIVO',
    diasAulas: [{ diaSemana: 'SEGUNDA', duracaoAula: 60, horaInicial: '10:00', ativo: true }],
    aulas
  };
}

function enviaJson(method, url, body) {
  return request(app)[method](url).set('Content-Type', 'application/json').send(body);
}

describe('app.js montado - limite do corpo da requisição', () => {
  // 401 = o parser aceitou o corpo e a autenticação negou
  test('PUT /contratos/:id com 1800 aulas no formato do GET, sem observação, passa do parser', async () => {
    const body = JSON.stringify(
      contrato(Array.from({ length: TOTAL_AULAS }, (_, i) => aulaFormatoGet(i)))
    );

    const response = await enviaJson('put', `/api/contratos/${CUID}`, body);

    expect(Buffer.byteLength(body)).toBeLessThan(LIMITE);
    expect(response.status).toBe(401);
  });

  test('PUT /contratos/:id com 1800 aulas, todas com observação de 1000 caracteres (pior caso), passa do parser', async () => {
    const aulas = Array.from({ length: TOTAL_AULAS }, (_, i) =>
      aulaFormatoGet(i, 'o'.repeat(1000))
    );
    const body = JSON.stringify(contrato(aulas));

    const response = await enviaJson('put', `/api/contratos/${CUID}`, body);

    expect(Buffer.byteLength(body)).toBeGreaterThan(MB);
    expect(Buffer.byteLength(body)).toBeLessThan(LIMITE);
    expect(response.status).toBe(401);
  });

  test('POST /contratos com 1800 aulas no formato do generate passa do parser', async () => {
    const body = JSON.stringify(
      contrato(Array.from({ length: TOTAL_AULAS }, (_, i) => aulaFormatoGenerate(i)))
    );

    const response = await enviaJson('post', '/api/contratos', body);

    expect(Buffer.byteLength(body)).toBeLessThan(LIMITE);
    expect(response.status).toBe(401);
  });

  test('JSON acima de 3mb responde 413 PayloadTooLarge', async () => {
    const body = JSON.stringify({ texto: 'a'.repeat(LIMITE + 100 * 1024) });

    const response = await enviaJson('post', '/api/health', body);

    expect(Buffer.byteLength(body)).toBeGreaterThan(LIMITE);
    expect(response.status).toBe(413);
    expect(response.body.error).toBe('PayloadTooLarge');
    expect(response.body.message).toBe('Corpo da requisição excede o tamanho permitido');
    expect(JSON.stringify(response.body)).not.toContain('aaaa');
  });

  test('urlencoded acima de 3mb responde 413', async () => {
    const body = `texto=${'a'.repeat(LIMITE + 1024)}`;

    const response = await request(app)
      .post('/api/health')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send(body);

    expect(Buffer.byteLength(body)).toBeGreaterThan(LIMITE);
    expect(response.status).toBe(413);
    expect(response.body.error).toBe('PayloadTooLarge');
  });

  test('JSON malformado responde 400 e não 500', async () => {
    const response = await enviaJson('post', '/api/health', '{"texto": ');

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('BadRequest');
  });
});
