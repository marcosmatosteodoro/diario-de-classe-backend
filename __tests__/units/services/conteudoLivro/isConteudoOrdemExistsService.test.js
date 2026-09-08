import { jest } from '@jest/globals';
import { IsConteudoOrdemExistsService } from '../../../../src/services/conteudoLivro/isConteudoOrdemExistsService.js';
import ConteudoLivroRepository from '../../../../src/repositories/conteudoLivroRepository.js';

describe('IsConteudoOrdemExistsService', () => {
  let selectOneSpy;

  beforeEach(() => {
    selectOneSpy = jest.spyOn(ConteudoLivroRepository.prototype, 'selectOne');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('consulta pela dupla [idLivro, ordem] do índice único', async () => {
    selectOneSpy.mockResolvedValue(null);

    await IsConteudoOrdemExistsService.handle({ idLivro: 'livro-1', ordem: 3 });

    expect(selectOneSpy).toHaveBeenCalledWith({
      where: { idLivro: 'livro-1', ordem: 3 },
      select: { id: true }
    });
  });

  it('ignora o próprio registro na edição', async () => {
    selectOneSpy.mockResolvedValue(null);

    await IsConteudoOrdemExistsService.handle({
      idLivro: 'livro-1',
      ordem: 3,
      idIgnorado: 'conteudo-1'
    });

    const { where } = selectOneSpy.mock.calls[0][0];
    expect(where.id).toEqual({ not: 'conteudo-1' });
  });

  it('devolve true quando a ordem está ocupada', async () => {
    selectOneSpy.mockResolvedValue({ id: 'conteudo-9' });

    await expect(
      IsConteudoOrdemExistsService.handle({ idLivro: 'livro-1', ordem: 3 })
    ).resolves.toBe(true);
  });

  it('devolve false quando a ordem está livre', async () => {
    selectOneSpy.mockResolvedValue(null);

    await expect(
      IsConteudoOrdemExistsService.handle({ idLivro: 'livro-1', ordem: 3 })
    ).resolves.toBe(false);
  });
});
