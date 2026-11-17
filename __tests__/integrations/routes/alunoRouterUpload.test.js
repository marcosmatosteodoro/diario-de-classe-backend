import fs from 'fs';
import { randomUUID } from 'crypto';
import os from 'os';
import path from 'path';
import util from 'util';
import express from 'express';
import request from 'supertest';
import { jest } from '@jest/globals';
import { planilhaXlsx } from '../../mocks/planilhaXlsx.js';
import routes from '../../../src/routes.js';
import Constants from '../../../src/utilities/constants.js';
import { createJwt } from '../../../src/utilities/createJwt.js';
import AlunoRepository from '../../../src/repositories/alunoRepository.js';
import { CreateAlunoService } from '../../../src/services/aluno/createAlunoService.js';
import { UpdateAlunoService } from '../../../src/services/aluno/updateAlunoService.js';
import { UploadAlunoExcelController } from '../../../src/controllers/aluno/uploadAlunoExcelController.js';
import LoggerManager from '../../../src/utilities/loggerManager.js';
import { GetAlunoListController } from '../../../src/controllers/aluno/getAlunoListController.js';

const uploadDir = path.join(os.tmpdir(), 'uploads');

function buildApp(t = key => key) {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.t = t;
    next();
  });
  app.use('/', routes);
  return app;
}

const token = role => `Bearer ${createJwt({ sub: `${role}-1`, role }, Constants.jwtSecret)}`;

const arquivosComConteudo = buffer =>
  fs.existsSync(uploadDir)
    ? fs.readdirSync(uploadDir).filter(nome => {
        try {
          return fs.readFileSync(path.join(uploadDir, nome)).equals(buffer);
        } catch {
          return false;
        }
      })
    : [];

describe('POST /alunos/upload (router real de src/routes.js)', () => {
  let app;
  const originals = {};
  let arquivoRecebido;

  beforeEach(() => {
    app = buildApp();
    originals.execute = UploadAlunoExcelController.prototype.execute;
    originals.selectOne = AlunoRepository.prototype.selectOne;
    originals.create = CreateAlunoService.handle;
    originals.update = UpdateAlunoService.handle;
    originals.list = GetAlunoListController.handle;
    arquivoRecebido = undefined;
    UploadAlunoExcelController.prototype.execute = jest.fn(function execute(...args) {
      arquivoRecebido = this.req.file?.path;
      return originals.execute.apply(this, args);
    });
    AlunoRepository.prototype.selectOne = jest.fn().mockResolvedValue(null);
    CreateAlunoService.handle = jest.fn().mockResolvedValue({ id: 'aluno-1' });
    UpdateAlunoService.handle = jest.fn();
    GetAlunoListController.handle = jest.fn(async (req, res) => res.status(200).json([]));
  });

  afterEach(() => {
    if (arquivoRecebido) fs.rmSync(arquivoRecebido, { force: true });
    UploadAlunoExcelController.prototype.execute = originals.execute;
    AlunoRepository.prototype.selectOne = originals.selectOne;
    CreateAlunoService.handle = originals.create;
    UpdateAlunoService.handle = originals.update;
    GetAlunoListController.handle = originals.list;
  });

  test('upload de alunos exige admin: professor recebe 403 e nenhum arquivo é gravado', async () => {
    const conteudo = planilhaXlsx([['Ana Lima', `${randomUUID()}@example.com`]]);

    const response = await request(app)
      .post('/alunos/upload')
      .set('Authorization', token('member'))
      .attach('file', conteudo, 'alunos.xlsx');

    expect(response.status).toBe(403);
    expect(response.body.message).toBe('api.errors.forbidden');
    expect(UploadAlunoExcelController.prototype.execute).not.toHaveBeenCalled();
    expect(CreateAlunoService.handle).not.toHaveBeenCalled();
    expect(arquivosComConteudo(conteudo)).toEqual([]);
  });

  test('admin com .xlsx válido segue o fluxo e cria o aluno da planilha', async () => {
    const response = await request(app)
      .post('/alunos/upload')
      .set('Authorization', token('admin'))
      .attach('file', planilhaXlsx([['Ana Lima', 'ana.lima@example.com']]), 'alunos.xlsx');

    expect(response.status).toBe(200);
    expect(UploadAlunoExcelController.prototype.execute).toHaveBeenCalledTimes(1);
    expect(path.dirname(arquivoRecebido)).toBe(uploadDir);
    expect(CreateAlunoService.handle).toHaveBeenCalledWith({
      nome: 'Ana',
      sobrenome: 'Lima',
      email: 'ana.lima@example.com',
      criador: 'admin-1'
    });
  });
});

describe('POST /alunos/upload com e-mail repetido', () => {
  let app;
  const originals = {};
  let arquivoRecebido;
  let consoleSpies;

  beforeEach(() => {
    app = buildApp();
    originals.execute = UploadAlunoExcelController.prototype.execute;
    originals.selectOne = AlunoRepository.prototype.selectOne;
    originals.create = CreateAlunoService.handle;
    originals.warn = LoggerManager.warn;
    arquivoRecebido = undefined;
    UploadAlunoExcelController.prototype.execute = jest.fn(function execute(...args) {
      arquivoRecebido = this.req.file?.path;
      return originals.execute.apply(this, args);
    });
    AlunoRepository.prototype.selectOne = jest.fn().mockResolvedValue(null);
    CreateAlunoService.handle = jest.fn();
    LoggerManager.warn = jest.fn((...args) => originals.warn(...args));
    consoleSpies = ['log', 'info', 'warn', 'error'].map(metodo =>
      jest.spyOn(console, metodo).mockImplementation(() => {})
    );
  });

  afterEach(() => {
    if (arquivoRecebido) fs.rmSync(arquivoRecebido, { force: true });
    UploadAlunoExcelController.prototype.execute = originals.execute;
    AlunoRepository.prototype.selectOne = originals.selectOne;
    CreateAlunoService.handle = originals.create;
    LoggerManager.warn = originals.warn;
    consoleSpies.forEach(spy => spy.mockRestore());
  });

  const serializadoComoConsole = () =>
    consoleSpies.flatMap(spy => spy.mock.calls.map(args => util.format(...args))).join('\n');

  test('e-mail repetido devolve 400, loga só a linha e não escreve o e-mail em console.*', async () => {
    const email = `${randomUUID()}@example.com`;
    const response = await request(app)
      .post('/alunos/upload')
      .set('Authorization', token('admin'))
      .attach(
        'file',
        planilhaXlsx([
          ['Ana Lima', 'outra@example.com'],
          ['Bia Souza', email],
          ['Caio Souza', email]
        ]),
        'alunos.xlsx'
      );

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: 'alunos.upload.repeated_emails' });
    expect(LoggerManager.warn).toHaveBeenCalledTimes(1);
    expect(LoggerManager.warn).toHaveBeenCalledWith('aluno.upload.email_duplicado', { linha: 3 });
    expect(CreateAlunoService.handle).not.toHaveBeenCalled();
    const saida = serializadoComoConsole();
    // controle positivo: a captura enxerga o que o logger escreve
    expect(saida).toContain('aluno.upload.email_duplicado');
    expect(saida).toContain('linha: 3');
    expect(saida.includes(email)).toBe(false);
  });
});

describe('POST /alunos/upload com teto de linhas e caracteres', () => {
  let app;
  const originals = {};
  let arquivoRecebido;

  beforeEach(() => {
    app = buildApp((key, opcoes) => (opcoes ? `${key}|${JSON.stringify(opcoes)}` : key));
    originals.execute = UploadAlunoExcelController.prototype.execute;
    originals.selectOne = AlunoRepository.prototype.selectOne;
    originals.create = CreateAlunoService.handle;
    originals.update = UpdateAlunoService.handle;
    originals.list = GetAlunoListController.handle;
    arquivoRecebido = undefined;
    UploadAlunoExcelController.prototype.execute = jest.fn(function execute(...args) {
      arquivoRecebido = this.req.file?.path;
      return originals.execute.apply(this, args);
    });
    AlunoRepository.prototype.selectOne = jest.fn().mockResolvedValue(null);
    CreateAlunoService.handle = jest.fn().mockResolvedValue({ id: 'aluno-1' });
    UpdateAlunoService.handle = jest.fn();
    GetAlunoListController.handle = jest.fn(async (req, res) => res.status(200).json([]));
  });

  afterEach(() => {
    if (arquivoRecebido) fs.rmSync(arquivoRecebido, { force: true });
    UploadAlunoExcelController.prototype.execute = originals.execute;
    AlunoRepository.prototype.selectOne = originals.selectOne;
    CreateAlunoService.handle = originals.create;
    UpdateAlunoService.handle = originals.update;
    GetAlunoListController.handle = originals.list;
  });

  const linhasValidas = quantidade =>
    Array.from({ length: quantidade }, (_, i) => [`Aluno${i} Teste`, `aluno${i}@example.com`]);

  const enviar = linhas =>
    request(app)
      .post('/alunos/upload')
      .set('Authorization', token('admin'))
      .attach('file', planilhaXlsx(linhas), 'alunos.xlsx');

  const nadaGravado = () => {
    expect(AlunoRepository.prototype.selectOne).not.toHaveBeenCalled();
    expect(CreateAlunoService.handle).not.toHaveBeenCalled();
    expect(UpdateAlunoService.handle).not.toHaveBeenCalled();
  };

  test('501 alunos recusam a planilha inteira com too_many', async () => {
    const response = await enviar(linhasValidas(501));

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: 'alunos.upload.too_many|{"max":500}' });
    nadaGravado();
  });

  test('500 alunos seguem o fluxo normal', async () => {
    const response = await enviar(linhasValidas(500));

    expect(response.status).toBe(200);
    expect(CreateAlunoService.handle).toHaveBeenCalledTimes(500);
  });

  test('nome completo com 256 caracteres recusa com a linha certa', async () => {
    const linhas = linhasValidas(3);
    linhas[1][0] = `Ana ${'x'.repeat(252)}`;
    expect(linhas[1][0]).toHaveLength(256);

    const response = await enviar(linhas);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: 'alunos.upload.line_too_long|{"max":500,"linha":2}' });
    nadaGravado();
  });

  test('e-mail com 256 caracteres recusa a planilha', async () => {
    const linhas = linhasValidas(3);
    linhas[2][1] = `${'x'.repeat(256 - '@example.com'.length)}@example.com`;
    expect(linhas[2][1]).toHaveLength(256);

    const response = await enviar(linhas);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: 'alunos.upload.line_too_long|{"max":500,"linha":3}' });
    nadaGravado();
  });

  test('nome completo e e-mail com 255 caracteres seguem o fluxo normal', async () => {
    const nome = `Ana ${'x'.repeat(251)}`;
    const email = `${'x'.repeat(255 - '@example.com'.length)}@example.com`;
    expect(nome).toHaveLength(255);
    expect(email).toHaveLength(255);

    const response = await enviar([[nome, email]]);

    expect(response.status).toBe(200);
    expect(CreateAlunoService.handle).toHaveBeenCalledTimes(1);
  });
});
