import XLSX from 'xlsx';

// Monta um .xlsx em memória a partir de linhas (array de arrays) e devolve o Buffer.
export function planilhaXlsx(linhas) {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(linhas), 'Plan1');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}
