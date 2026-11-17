import fs from 'fs';
import os from 'os';
import path from 'path';
import { UploadAlunoExcelController } from '../../../../src/controllers/aluno/uploadAlunoExcelController.js';
import { planilhaXlsx } from '../../../mocks/planilhaXlsx.js';

describe('UploadAlunoExcelController.getXLSXDataByFile', () => {
  let controller;
  let dir;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'upload-aluno-'));
    const req = { body: {}, t: key => key, user: { sub: 'u-1' } };
    const res = { status: () => res, json: () => res };
    controller = new UploadAlunoExcelController(req, res);
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('lê uma planilha .xlsx e devolve array de arrays', () => {
    const arquivo = path.join(dir, 'alunos.xlsx');
    fs.writeFileSync(
      arquivo,
      planilhaXlsx([
        ['Ana Lima', 'ana.lima@example.com'],
        ['Caio Reis', 'caio.reis@example.com']
      ])
    );

    expect(controller.getXLSXDataByFile(arquivo)).toEqual([
      ['Ana Lima', 'ana.lima@example.com'],
      ['Caio Reis', 'caio.reis@example.com']
    ]);
  });

  it('lê um .csv no mesmo formato', () => {
    const arquivo = path.join(dir, 'alunos.csv');
    fs.writeFileSync(arquivo, 'Nome Sobrenome,email\nAna Lima,ana.lima@example.com\n');

    expect(controller.getXLSXDataByFile(arquivo)).toEqual([
      ['Nome Sobrenome', 'email'],
      ['Ana Lima', 'ana.lima@example.com']
    ]);
  });
});
