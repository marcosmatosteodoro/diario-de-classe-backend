import fs from 'fs';
import os from 'os';
import path from 'path';
import express from 'express';
import request from 'supertest';
import { jest } from '@jest/globals';
import XLSX from 'xlsx';
import routes from '../../../src/routes.js';
import Constants from '../../../src/utilities/constants.js';
import { createJwt } from '../../../src/utilities/createJwt.js';
import AlunoRepository from '../../../src/repositories/alunoRepository.js';
import { CreateAlunoService } from '../../../src/services/aluno/createAlunoService.js';
import { UpdateAlunoService } from '../../../src/services/aluno/updateAlunoService.js';
import { UploadAlunoExcelController } from '../../../src/controllers/aluno/uploadAlunoExcelController.js';
import { GetAlunoListController } from '../../../src/controllers/aluno/getAlunoListController.js';

const uploadDir = path.join(os.tmpdir(), 'uploads');

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.t = key => key;
    next();
  });
  app.use('/', routes);
  return app;
}

const token = role => `Bearer ${createJwt({ sub: `${role}-1`, role }, Constants.jwtSecret)}`;

const planilha = () => {
  const ws = XLSX.utils.aoa_to_sheet([['Ana Lima', 'ana.lima@example.com']]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Plan1');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
};

const listaUploads = () => (fs.existsSync(uploadDir) ? fs.readdirSync(uploadDir).sort() : []);

describe('POST /alunos/upload (router real de src/routes.js)', () => {
  let app;
  const originals = {};

  beforeEach(() => {
    app = buildApp();
    originals.execute = UploadAlunoExcelController.prototype.execute;
    originals.selectOne = AlunoRepository.prototype.selectOne;
    originals.create = CreateAlunoService.handle;
    originals.update = UpdateAlunoService.handle;
    originals.list = GetAlunoListController.handle;
    UploadAlunoExcelController.prototype.execute = jest.fn(originals.execute);
    AlunoRepository.prototype.selectOne = jest.fn().mockResolvedValue(null);
    CreateAlunoService.handle = jest.fn().mockResolvedValue({ id: 'aluno-1' });
    UpdateAlunoService.handle = jest.fn();
    GetAlunoListController.handle = jest.fn(async (req, res) => res.status(200).json([]));
  });

  afterEach(() => {
    UploadAlunoExcelController.prototype.execute = originals.execute;
    AlunoRepository.prototype.selectOne = originals.selectOne;
    CreateAlunoService.handle = originals.create;
    UpdateAlunoService.handle = originals.update;
    GetAlunoListController.handle = originals.list;
  });

  test('upload de alunos exige admin: professor recebe 403 e nenhum arquivo é gravado', async () => {
    const antes = listaUploads();

    const response = await request(app)
      .post('/alunos/upload')
      .set('Authorization', token('member'))
      .attach('file', planilha(), 'alunos.xlsx');

    expect(response.status).toBe(403);
    expect(response.body.message).toBe('api.errors.forbidden');
    expect(UploadAlunoExcelController.prototype.execute).not.toHaveBeenCalled();
    expect(CreateAlunoService.handle).not.toHaveBeenCalled();
    expect(listaUploads()).toEqual(antes);
  });

  test('admin com .xlsx válido segue o fluxo e cria o aluno da planilha', async () => {
    const response = await request(app)
      .post('/alunos/upload')
      .set('Authorization', token('admin'))
      .attach('file', planilha(), 'alunos.xlsx');

    expect(response.status).toBe(200);
    expect(UploadAlunoExcelController.prototype.execute).toHaveBeenCalledTimes(1);
    expect(CreateAlunoService.handle).toHaveBeenCalledWith({
      nome: 'Ana',
      sobrenome: 'Lima',
      email: 'ana.lima@example.com',
      criador: 'admin-1'
    });
  });
});
