import { CreateLivroService } from '../../../services/livro/createLivroService.js';
import BaseSeed from '../baseSeed.js';

export class LivrosSeed extends BaseSeed {
  constructor(params = null) {
    super(params);
  }

  generateMocks() {
    return [
      // Trilha de ingles
      {
        nome: 'English Foundations 1',
        idioma: 'INGLES',
        nivel: 1,
        ativo: true
      },
      {
        nome: 'English Foundations 2',
        idioma: 'INGLES',
        nivel: 2,
        ativo: true
      },
      {
        nome: 'English Essentials 3',
        idioma: 'INGLES',
        nivel: 3,
        ativo: true
      },
      {
        nome: 'English Essentials 4',
        idioma: 'INGLES',
        nivel: 4,
        ativo: true
      },
      {
        nome: 'English Intermediate 5',
        idioma: 'INGLES',
        nivel: 5,
        ativo: true
      },
      {
        nome: 'English Intermediate 6',
        idioma: 'INGLES',
        nivel: 6,
        ativo: true
      },
      {
        nome: 'English Advanced 7',
        idioma: 'INGLES',
        nivel: 7,
        ativo: true
      },
      {
        nome: 'English Mastery 8',
        idioma: 'INGLES',
        nivel: 8,
        ativo: false // Exemplo de livro fora de catálogo
      },
      // Trilha de espanhol
      {
        nome: 'Espanhol Básico 1',
        idioma: 'ESPANHOL',
        nivel: 1,
        ativo: true
      },
      {
        nome: 'Espanhol Básico 2',
        idioma: 'ESPANHOL',
        nivel: 2,
        ativo: true
      },
      {
        nome: 'Espanhol Intermediário 3',
        idioma: 'ESPANHOL',
        nivel: 3,
        ativo: true
      },
      {
        nome: 'Espanhol Intermediário 4',
        idioma: 'ESPANHOL',
        nivel: 4,
        ativo: true
      },
      {
        nome: 'Espanhol Avançado 5',
        idioma: 'ESPANHOL',
        nivel: 5,
        ativo: true
      },
      {
        nome: 'Espanhol Avançado 6',
        idioma: 'ESPANHOL',
        nivel: 6,
        ativo: false // Exemplo de livro fora de catálogo
      },
      {
        nome: 'Espanhol Conversação',
        idioma: 'ESPANHOL',
        nivel: null, // Curso livre, sem posição na trilha
        ativo: true
      },
      // Trilha de frances
      {
        nome: 'Francês Iniciante 1',
        idioma: 'FRANCES',
        nivel: 1,
        ativo: true
      },
      {
        nome: 'Francês Iniciante 2',
        idioma: 'FRANCES',
        nivel: 2,
        ativo: true
      },
      {
        nome: 'Francês Intermediário 3',
        idioma: 'FRANCES',
        nivel: 3,
        ativo: true
      },
      {
        nome: 'Francês Avançado 4',
        idioma: 'FRANCES',
        nivel: 4,
        ativo: true
      },
      {
        nome: 'Francês para Negócios',
        idioma: 'FRANCES',
        nivel: null, // Curso livre, sem posição na trilha
        ativo: true
      }
    ];
  }

  getCreateEntityService() {
    return CreateLivroService;
  }

  static async handle() {
    const livrosSeed = new LivrosSeed();
    return await livrosSeed.execute();
  }
}
