import { GetCronogramaListByLivroService } from './getCronogramaListByLivroService.js';
import { ResequenciarCronogramaService } from './resequenciarCronogramaService.js';

/**
 * Resequencia todos os contratos que estao cursando um livro.
 *
 * Necessario sempre que a sequencia do livro muda (conteudo criado, reordenado,
 * removido ou planilha reimportada): sem isso, os cronogramas em curso ficariam
 * apontando para a sequencia antiga.
 *
 * Nao estende AbstractService porque nao fala com um repositorio proprio:
 * apenas orquestra outros services.
 */
export class ResequenciarCronogramasDoLivroService {
  constructor(idLivro) {
    this.idLivro = idLivro;
  }

  async execute() {
    const cronogramas = await GetCronogramaListByLivroService.handle(this.idLivro, {
      apenasAtivos: true
    });

    if (!cronogramas || cronogramas.length === 0) {
      return { contratosResequenciados: 0 };
    }

    const contratos = [...new Set(cronogramas.map(cronograma => cronograma.idContrato))];

    for (const idContrato of contratos) {
      await ResequenciarCronogramaService.handle(idContrato);
    }

    return { contratosResequenciados: contratos.length };
  }

  static async handle(idLivro) {
    const service = new ResequenciarCronogramasDoLivroService(idLivro);
    return await service.execute();
  }
}
