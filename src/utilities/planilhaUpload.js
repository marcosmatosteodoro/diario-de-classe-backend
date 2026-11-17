import multer from 'multer';
import os from 'os';
import path from 'path';

export const tamanhoMaximoPlanilha = 10 * 1024 * 1024;

// Usa /tmp tanto em produção quanto local
export const uploadDir = path.join(os.tmpdir(), 'uploads');

// Os dois uploads de planilha (aluno e conteúdo de livro) compartilham destino e limites.
export const uploadPlanilha = multer({
  dest: uploadDir,
  limits: { fileSize: tamanhoMaximoPlanilha, files: 1, fields: 10 }
});
