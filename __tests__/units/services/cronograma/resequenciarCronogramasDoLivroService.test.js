import { jest } from '@jest/globals';
import { ResequenciarCronogramasDoLivroService } from '../../../../src/services/cronograma/resequenciarCronogramasDoLivroService.js';
import { GetCronogramaListByLivroService } from '../../../../src/services/cronograma/getCronogramaListByLivroService.js';
import { ResequenciarCronogramaService } from '../../../../src/services/cronograma/resequenciarCronogramaService.js';

describe('ResequenciarCronogramasDoLivroService', () => {
  let listaSpy;
  let reseqSpy;

  beforeEach(() => {
    listaSpy = jest.spyOn(GetCronogramaListByLivroService, 'handle');
    reseqSpy = jest
      .spyOn(ResequenciarCronogramaService, 'handle')
      .mockResolvedValue({ resequenciado: true });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('busca apenas os cronogramas ativos do livro', async () => {
    listaSpy.mockResolvedValue([]);

    await ResequenciarCronogramasDoLivroService.handle('livro-1');

    expect(listaSpy).toHaveBeenCalledWith('livro-1', { apenasAtivos: true });
  });

  it('é no-op quando nenhum aluno está cursando o livro', async () => {
    listaSpy.mockResolvedValue([]);

    const resultado = await ResequenciarCronogramasDoLivroService.handle('livro-1');

    expect(resultado).toEqual({ contratosResequenciados: 0 });
    expect(reseqSpy).not.toHaveBeenCalled();
  });

  it('resequencia cada contrato que cursa o livro', async () => {
    listaSpy.mockResolvedValue([
      { id: 'c1', idContrato: 'contrato-1', ativo: true },
      { id: 'c2', idContrato: 'contrato-2', ativo: true }
    ]);

    const resultado = await ResequenciarCronogramasDoLivroService.handle('livro-1');

    expect(resultado).toEqual({ contratosResequenciados: 2 });
    expect(reseqSpy).toHaveBeenCalledWith('contrato-1');
    expect(reseqSpy).toHaveBeenCalledWith('contrato-2');
  });

  it('não resequencia o mesmo contrato duas vezes', async () => {
    listaSpy.mockResolvedValue([
      { id: 'c1', idContrato: 'contrato-1', ativo: true },
      { id: 'c2', idContrato: 'contrato-1', ativo: true }
    ]);

    const resultado = await ResequenciarCronogramasDoLivroService.handle('livro-1');

    expect(resultado).toEqual({ contratosResequenciados: 1 });
    expect(reseqSpy).toHaveBeenCalledTimes(1);
  });

  it('trata lista nula do repositório', async () => {
    listaSpy.mockResolvedValue(null);

    await expect(ResequenciarCronogramasDoLivroService.handle('livro-1')).resolves.toEqual({
      contratosResequenciados: 0
    });
  });
});
