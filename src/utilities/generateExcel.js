import XLSX from 'xlsx';

export function generateExcel({ res, filename, data, sheetName = 'Sheet1' }) {
  // Cria worksheet e workbook
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  // Gera buffer do arquivo Excel
  const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  return excelBuffer;
}
