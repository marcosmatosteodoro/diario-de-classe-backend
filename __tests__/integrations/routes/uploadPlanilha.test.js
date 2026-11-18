import { randomBytes, randomUUID } from 'crypto';
import express from 'express';
import multer from 'multer';
import request from 'supertest';
import XLSX from 'xlsx';
import { jest } from '@jest/globals';
import { planilhaXlsx } from '../../mocks/planilhaXlsx.js';
import { arquivosComConteudo, registroDeEnvios } from '../../mocks/arquivosUpload.js';
import routes from '../../../src/routes.js';
import Constants from '../../../src/utilities/constants.js';
import { createJwt } from '../../../src/utilities/createJwt.js';
import ErrorHandler from '../../../src/middlewares/error-handler.js';
import { UploadAlunoExcelController } from '../../../src/controllers/aluno/uploadAlunoExcelController.js';
import { UploadConteudoLivroExcelController } from '../../../src/controllers/conteudoLivro/uploadConteudoLivroExcelController.js';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const LIMITE = 10 * 1024 * 1024;
const ID_LIVRO = `c${'a'.repeat(24)}`;

const rotas = [
  { nome: 'alunos', url: '/alunos/upload', controller: UploadAlunoExcelController },
  {
    nome: 'conteúdos de livro',
    url: `/livros/${ID_LIVRO}/conteudos/upload`,
    controller: UploadConteudoLivroExcelController
  }
];

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.t = key => key;
    next();
  });
  app.use('/', routes);
  // Mesmo encadeamento de src/app.js: o 4º argumento é o que faz o Express tratar como erro.
  app.use((err, req, res, _next) => {
    ErrorHandler(err, req, res);
  });
  return app;
}

const token = `Bearer ${createJwt({ sub: 'admin-1', role: 'admin', ver: Constants.accessTokenVersion }, Constants.jwtSecret)}`;

const xlsReal = () => {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([['Ana Lima', `${randomUUID()}@example.com`]]),
    'P'
  );
  return XLSX.write(wb, { type: 'buffer', bookType: 'xls' });
};

describe.each(rotas)('upload de planilha em $nome (router real de src/routes.js)', rota => {
  let app;
  let original;
  let recebidos;
  const envios = registroDeEnvios();

  beforeEach(() => {
    app = buildApp();
    original = rota.controller.prototype.execute;
    recebidos = [];
    rota.controller.prototype.execute = jest.fn(async function execute() {
      recebidos.push(this.req.file.path);
      return this.res.status(200).json({ ok: true });
    });
  });

  afterEach(() => {
    rota.controller.prototype.execute = original;
    envios.limpar();
  });

  const enviar = (conteudo, nome, mime) =>
    request(app)
      .post(rota.url)
      .set('Authorization', token)
      .attach('file', envios.registrar(conteudo), { filename: nome, contentType: mime });

  test('upload rejects files above the size limit while streaming (413, nothing left on disk)', async () => {
    const conteudo = Buffer.concat([randomBytes(16), Buffer.alloc(LIMITE + 1, 0x41)]);

    const response = await enviar(conteudo, 'grande.xlsx', XLSX_MIME);

    expect(response.status).toBe(413);
    expect(response.body).toEqual({
      error: 'PayloadTooLarge',
      message: 'api.errors.payload_too_large'
    });
    expect(rota.controller.prototype.execute).not.toHaveBeenCalled();
    expect(arquivosComConteudo(conteudo)).toEqual([]);
  });

  test('controle positivo: arquivo aceito é gravado no diretório exportado pelo módulo de upload', async () => {
    const conteudo = planilhaXlsx([['Ana Lima', `${randomBytes(8).toString('hex')}@example.com`]]);

    const response = await enviar(conteudo, 'ok.xlsx', XLSX_MIME);

    expect(response.status).toBe(200);
    expect(recebidos).toHaveLength(1);
    expect(arquivosComConteudo(conteudo)).toEqual([recebidos[0].split('/').pop()]);
  });

  test('binário aleatório com nome .xlsx e MIME de xlsx devolve 400 invalid_type', async () => {
    const response = await enviar(randomBytes(512), 'falso.xlsx', XLSX_MIME);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: 'validation.excel_file.invalid_type',
      allowedFormats: ['CSV', 'XLS', 'XLSX']
    });
    expect(rota.controller.prototype.execute).not.toHaveBeenCalled();
  });

  test('MIME válido com extensão .exe devolve 400', async () => {
    const response = await enviar(planilhaXlsx([['a', randomUUID()]]), 'planilha.exe', XLSX_MIME);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('validation.excel_file.invalid_type');
    expect(rota.controller.prototype.execute).not.toHaveBeenCalled();
  });

  test('.xlsx real com MIME application/octet-stream devolve 400', async () => {
    const response = await enviar(
      planilhaXlsx([['a', randomUUID()]]),
      'planilha.xlsx',
      'application/octet-stream'
    );

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('validation.excel_file.invalid_type');
    expect(rota.controller.prototype.execute).not.toHaveBeenCalled();
  });

  test.each([
    [
      '.xlsx real',
      () => planilhaXlsx([['Ana Lima', `${randomUUID()}@example.com`]]),
      'a.xlsx',
      XLSX_MIME
    ],
    ['.xls real', xlsReal, 'a.xls', 'application/vnd.ms-excel'],
    ['.csv texto', () => Buffer.from(`Ana Lima,${randomUUID()}@example.com\n`), 'a.csv', 'text/csv']
  ])('%s é aceito', async (_nome, gerar, arquivo, mime) => {
    const response = await enviar(gerar(), arquivo, mime);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true });
    expect(rota.controller.prototype.execute).toHaveBeenCalledTimes(1);
  });

  test('.csv com byte nulo no começo devolve 400', async () => {
    const response = await enviar(
      Buffer.concat([Buffer.from([0x41, 0x2c, 0x00, 0x42]), randomBytes(8)]),
      'a.csv',
      'text/csv'
    );

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('validation.excel_file.invalid_type');
  });
});

describe('ErrorHandler com erro do multer', () => {
  let consoleSpies;

  beforeEach(() => {
    consoleSpies = ['log', 'error'].map(metodo =>
      jest.spyOn(console, metodo).mockImplementation(() => {})
    );
  });

  afterEach(() => {
    consoleSpies.forEach(spy => spy.mockRestore());
  });

  const chamadasDeConsole = () =>
    consoleSpies.reduce((total, spy) => total + spy.mock.calls.length, 0);

  const executar = err => {
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    ErrorHandler(err, { t: key => key }, res);
    return res;
  };

  test('LIMIT_FILE_COUNT devolve 400 bad_request sem o campo do cliente', () => {
    const err = new multer.MulterError('LIMIT_FILE_COUNT', 'campo-do-cliente');

    const res = executar(err);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'BadRequest',
      message: 'api.errors.bad_request'
    });
  });

  test('LIMIT_FILE_SIZE devolve 413 payload_too_large', () => {
    const res = executar(new multer.MulterError('LIMIT_FILE_SIZE', 'file'));

    expect(res.status).toHaveBeenCalledWith(413);
    expect(res.json).toHaveBeenCalledWith({
      error: 'PayloadTooLarge',
      message: 'api.errors.payload_too_large'
    });
  });

  test('erro do multer não escreve em console.*, e o erro genérico escreve (controle positivo)', () => {
    executar(new multer.MulterError('LIMIT_FILE_SIZE', 'file'));
    executar(new multer.MulterError('LIMIT_FILE_COUNT', 'campo-do-cliente'));
    expect(chamadasDeConsole()).toBe(0);

    executar(new Error('falha inesperada'));
    expect(chamadasDeConsole()).toBeGreaterThan(0);
  });
});
