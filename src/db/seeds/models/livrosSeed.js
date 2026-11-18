import { CreateLivroService } from '../../../services/livro/createLivroService.js';
import BaseSeed from '../baseSeed.js';
import { LIVROS_DEMO } from '../seedCatalogo.js';

export class LivrosSeed extends BaseSeed {
  constructor(params = null) {
    super(params);
  }

  generateMocks() {
    return LIVROS_DEMO.map(({ nome, idioma, nivel, ativo }) => ({ nome, idioma, nivel, ativo }));
  }

  getCreateEntityService() {
    return CreateLivroService;
  }

  static async handle() {
    const livrosSeed = new LivrosSeed();
    return await livrosSeed.execute();
  }
}
