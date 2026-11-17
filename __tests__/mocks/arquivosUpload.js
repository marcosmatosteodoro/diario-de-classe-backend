import fs from 'fs';
import path from 'path';
import { uploadDir } from '../../src/utilities/planilhaUpload.js';

// Lista os arquivos do diretório de upload cujo conteúdo é exatamente o buffer.
export const arquivosComConteudo = buffer =>
  fs.existsSync(uploadDir)
    ? fs.readdirSync(uploadDir).filter(nome => {
        try {
          return fs.readFileSync(path.join(uploadDir, nome)).equals(buffer);
        } catch {
          return false;
        }
      })
    : [];

// Registra cada buffer enviado e remove, por conteúdo, só o que esses envios gravaram:
// o diretório tem outros escritores, então nunca se limpa por listagem cega.
// Cada envio precisa de conteúdo único, senão a atribuição ao envio é ambígua.
export function registroDeEnvios() {
  const enviados = [];
  return {
    registrar(buffer) {
      enviados.push(buffer);
      return buffer;
    },
    limpar() {
      enviados.forEach(buffer =>
        arquivosComConteudo(buffer).forEach(nome =>
          fs.rmSync(path.join(uploadDir, nome), { force: true })
        )
      );
      enviados.length = 0;
    }
  };
}
