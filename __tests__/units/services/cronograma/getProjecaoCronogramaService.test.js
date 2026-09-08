import { jest } from '@jest/globals';
import { GetProjecaoCronogramaService } from '../../../../src/services/cronograma/getProjecaoCronogramaService.js';
import { GetCronogramaAtivoService } from '../../../../src/services/cronograma/getCronogramaAtivoService.js';
import { GetConteudoLivroListService } from '../../../../src/services/conteudoLivro/getConteudoLivroListService.js';
import AulaRepository from '../../../../src/repositories/aulaRepository.js';

const cronograma = {
  id: 'cron-1',
  idContrato: 'contrato-1',
  idLivro: 'livro-2',
  dataInicio: new Date('2026-03-01T00:00:00.000Z'),
  livro: { id: 'livro-2', nome: 'Livro 2' }
};

const aula = (id, overrides = {}) => ({
  id,
  dataAula: new Date('2026-03-05T00:00:00.000Z'),
  horaInicial: '08:00',
  horaFinal: '09:00',
  tipo: 'PADRAO',
  status: 'AGENDADA',
  observacao: null,
  idConteudo: null,
  conteudoManual: false,
  conteudo: null,
  ...overrides
});

const comConteudo = (id, idLivro, nomeLivro, ordem, titulo) => ({
  id: `c-${ordem}`,
  idLivro,
  ordem,
  titulo,
  descricao: null,
  livro: { id: idLivro, nome: nomeLivro }
});

describe('GetProjecaoCronogramaService', () => {
  let selectManySpy;

  beforeEach(() => {
    jest.spyOn(GetCronogramaAtivoService, 'handle').mockResolvedValue(cronograma);
    jest.spyOn(GetConteudoLivroListService, 'handle').mockResolvedValue([
      { id: 'c-1', ordem: 1, titulo: 'Unit 1', descricao: null },
      { id: 'c-2', ordem: 2, titulo: 'Unit 2', descricao: null }
    ]);
    selectManySpy = jest.spyOn(AulaRepository.prototype, 'selectMany');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('devolve null quando o aluno não tem livro em curso', async () => {
    GetCronogramaAtivoService.handle.mockResolvedValue(null);

    await expect(GetProjecaoCronogramaService.handle('aluno-1')).resolves.toBeNull();
    expect(selectManySpy).not.toHaveBeenCalled();
  });

  it('repassa o filtro de autorização e o idContrato ao buscar o cronograma', async () => {
    selectManySpy.mockResolvedValue([]);

    await GetProjecaoCronogramaService.handle(
      'aluno-1',
      { aluno: { criador: 'professor-1' } },
      'contrato-9'
    );

    expect(GetCronogramaAtivoService.handle).toHaveBeenCalledWith(
      { idAluno: 'aluno-1', idContrato: 'contrato-9' },
      { aluno: { criador: 'professor-1' } }
    );
  });

  it('lê as aulas do contrato ordenadas por data e hora', async () => {
    selectManySpy.mockResolvedValue([]);

    await GetProjecaoCronogramaService.handle('aluno-1');

    expect(selectManySpy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { idContrato: 'contrato-1' },
        orderBy: [{ dataAula: 'asc' }, { horaInicial: 'asc' }]
      })
    );
  });

  it('monta a linha com o nome do livro do próprio conteúdo', async () => {
    // Aula concluída do livro 1 dentro de um contrato que hoje cursa o livro 2:
    // a linha tem que dizer "Livro 1", não o nome do livro atual.
    selectManySpy.mockResolvedValue([
      aula('a1', {
        status: 'CONCLUIDA',
        idConteudo: 'L1-c1',
        conteudo: comConteudo('L1-c1', 'livro-1', 'Livro 1', 1, 'Unit 1 do L1')
      })
    ]);

    const { linhas } = await GetProjecaoCronogramaService.handle('aluno-1');

    expect(linhas[0].livroNome).toBe('Livro 1');
    expect(linhas[0].idLivro).toBe('livro-1');
    expect(linhas[0].titulo).toBe('Unit 1 do L1');
  });

  it('deixa os campos de conteúdo nulos quando a aula não tem vínculo', async () => {
    selectManySpy.mockResolvedValue([aula('a1')]);

    const { linhas } = await GetProjecaoCronogramaService.handle('aluno-1');

    expect(linhas[0].livroNome).toBeNull();
    expect(linhas[0].ordem).toBeNull();
    expect(linhas[0].titulo).toBeNull();
  });

  it('não conta conteúdo de livro anterior no resumo', async () => {
    // Regressão do conteudosRestantes negativo: o vínculo das aulas do livro 1
    // entrava na contagem do livro 2.
    selectManySpy.mockResolvedValue([
      aula('a1', {
        status: 'CONCLUIDA',
        idConteudo: 'L1-c1',
        conteudo: comConteudo('L1-c1', 'livro-1', 'Livro 1', 1, 'Unit 1 do L1')
      }),
      aula('a2', {
        idConteudo: 'c-1',
        conteudo: comConteudo('c-1', 'livro-2', 'Livro 2', 1, 'Unit 1')
      })
    ]);

    const { resumo, conteudosNaoAgendados } = await GetProjecaoCronogramaService.handle('aluno-1');

    expect(resumo).toEqual({
      totalAulas: 2,
      totalConteudos: 2,
      conteudosVinculados: 1,
      conteudosRestantes: 1,
      aulasSemConteudo: 0
    });
    // O resumo agora concorda com a lista de não agendados.
    expect(conteudosNaoAgendados).toHaveLength(1);
    expect(conteudosNaoAgendados[0].id).toBe('c-2');
  });

  it('conta aula que consome conteúdo mas ficou sem', async () => {
    selectManySpy.mockResolvedValue([aula('a1'), aula('a2')]);

    const { resumo } = await GetProjecaoCronogramaService.handle('aluno-1');

    expect(resumo.aulasSemConteudo).toBe(2);
  });
});
