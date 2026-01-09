import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function deleteUploadFiles() {
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  const fiveMinutesInMs = 5 * 60 * 1000; // 5 minutos em milissegundos
  const now = Date.now();

  try {
    // Verifica se o diretório existe
    if (!fs.existsSync(uploadsDir)) {
      console.log('Diretório uploads não encontrado.');
      return;
    }

    // Lê todos os arquivos do diretório
    const files = fs.readdirSync(uploadsDir);

    let deletedCount = 0;
    let errorCount = 0;

    files.forEach(file => {
      const filePath = path.join(uploadsDir, file);

      try {
        // Verifica se é um arquivo (não um diretório)
        const stats = fs.statSync(filePath);

        if (stats.isFile()) {
          // Calcula a diferença de tempo entre agora e a última modificação
          const fileAge = now - stats.mtime.getTime();

          // Se o arquivo tem mais de 5 minutos, deleta
          if (fileAge > fiveMinutesInMs) {
            fs.unlinkSync(filePath);
            console.log(
              `Arquivo deletado: ${file} (idade: ${Math.floor(fileAge / 60000)} minutos)`
            );
            deletedCount++;
          }
        }
      } catch (err) {
        console.error(`Erro ao processar arquivo ${file}:`, err.message);
        errorCount++;
      }
    });

    console.log(`\nResumo:`);
    console.log(`- Total de arquivos verificados: ${files.length}`);
    console.log(`- Arquivos deletados: ${deletedCount}`);
    console.log(`- Erros: ${errorCount}`);
  } catch (err) {
    console.error('Erro ao acessar o diretório uploads:', err.message);
  }
}

deleteUploadFiles();
