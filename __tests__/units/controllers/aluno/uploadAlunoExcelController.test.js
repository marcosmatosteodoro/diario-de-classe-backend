import fs from 'fs';
import os from 'os';
import path from 'path';
import XLSX from 'xlsx';
import { UploadAlunoExcelController } from '../../../../src/controllers/aluno/uploadAlunoExcelController.js';

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
    const ws = XLSX.utils.aoa_to_sheet([
      ['Ana Lima', 'ana.lima@example.com'],
      ['Caio Reis', 'caio.reis@example.com']
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Plan1');
    fs.writeFileSync(arquivo, XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));

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
