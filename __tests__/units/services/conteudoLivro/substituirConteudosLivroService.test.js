import { jest } from '@jest/globals';
import { SubstituirConteudosLivroService } from '../../../../src/services/conteudoLivro/substituirConteudosLivroService.js';
import ConteudoLivroRepository from '../../../../src/repositories/conteudoLivroRepository.js';

describe('SubstituirConteudosLivroService', () => {
  let substituirSpy;

  beforeEach(() => {
    substituirSpy = jest.spyOn(ConteudoLivroRepository.prototype, 'substituirByLivro');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('numera a ordem pela posição na planilha quando ela não vem informada', async () => {
    substituirSpy.mockResolvedValue({ count: 3 });

    await SubstituirConteudosLivroService.handle('livro-1', [
      { titulo: 'Unit 1' },
      { titulo: 'Unit 2' },
      { titulo: 'Unit 3' }
    ]);

    expect(substituirSpy).toHaveBeenCalledWith('livro-1', [
      { idLivro: 'livro-1', ordem: 1, titulo: 'Unit 1', descricao: null },
      { idLivro: 'livro-1', ordem: 2, titulo: 'Unit 2', descricao: null },
      { idLivro: 'livro-1', ordem: 3, titulo: 'Unit 3', descricao: null }
    ]);
  });

  it('preserva a ordem informada explicitamente', async () => {
    substituirSpy.mockResolvedValue({ count: 1 });

    await SubstituirConteudosLivroService.handle('livro-1', [
      { titulo: 'Unit 10', ordem: 10, descricao: 'Revisão' }
    ]);

    expect(substituirSpy).toHaveBeenCalledWith('livro-1', [
      { idLivro: 'livro-1', ordem: 10, titulo: 'Unit 10', descricao: 'Revisão' }
    ]);
  });

  it('devolve a contagem informada pelo repositório', async () => {
    substituirSpy.mockResolvedValue({ count: 2 });

    const resultado = await SubstituirConteudosLivroService.handle('livro-1', [
      { titulo: 'Unit 1' },
      { titulo: 'Unit 2' }
    ]);

    expect(resultado).toEqual({ count: 2 });
  });
});
