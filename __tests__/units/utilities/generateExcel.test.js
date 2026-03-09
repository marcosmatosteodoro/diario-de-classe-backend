import { jest } from '@jest/globals';
import { generateExcel } from '../../../src/utilities/generateExcel.js';
import XLSX from 'xlsx';

describe('generateExcel', () => {
  it('gera um arquivo Excel válido com os dados e nome de aba/arquivo corretos', () => {
    const res = {
      setHeader: jest.fn()
    };
    const filename = 'teste_relatorio';
    const data = [
      { id: 1, nome: 'Aluno 1' },
      { id: 2, nome: 'Aluno 2' }
    ];
    const sheetName = 'Alunos';

    const buffer = generateExcel({ res, filename, data, sheetName });

    // Verifica headers
    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      expect.stringContaining(`${filename}.xlsx`)
    );
    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );

    // Verifica se o buffer é um arquivo Excel válido
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    expect(workbook.SheetNames).toContain(sheetName);
    const worksheet = workbook.Sheets[sheetName];
    const result = XLSX.utils.sheet_to_json(worksheet);
    expect(result).toEqual(data);
  });
});
