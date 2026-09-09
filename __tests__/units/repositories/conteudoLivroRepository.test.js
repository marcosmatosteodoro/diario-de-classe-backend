import ConteudoLivroRepository from '../../../src/repositories/conteudoLivroRepository.js';

describe('ConteudoLivroRepository.substituirByLivro', () => {
  let repo;
  let chamadas;

  beforeEach(() => {
    repo = new ConteudoLivroRepository();
    chamadas = { update: [], create: [], deleteMany: [] };

    repo.entity.update = args => {
      chamadas.update.push(args);
      return Promise.resolve({ id: args.where.id });
    };
    repo.entity.create = args => {
      chamadas.create.push(args);
      return Promise.resolve({ id: 'novo' });
    };
    repo.entity.deleteMany = args => {
      chamadas.deleteMany.push(args);
      return Promise.resolve({ count: 0 });
    };
  });

  const dadosNovos = quantidade =>
    Array.from({ length: quantidade }, (_, i) => ({
      idLivro: 'livro-1',
      ordem: i + 1,
      titulo: `Unit ${i + 1}`,
      descricao: null
    }));

  it('atualiza a linha que já ocupa a ordem, sem apagar e recriar', async () => {
    // Regressão: deleteMany + createMany zerava a FK de TODAS as aulas via
    // ON DELETE SET NULL, apagando o histórico das concluídas.
    repo.entity.findMany = async () => [
      { id: 'c-1', ordem: 1 },
      { id: 'c-2', ordem: 2 }
    ];

    const resultado = await repo.substituirByLivro('livro-1', dadosNovos(2));

    expect(chamadas.update).toHaveLength(2);
    expect(chamadas.create).toHaveLength(0);
    expect(chamadas.deleteMany).toHaveLength(0);
    expect(resultado).toEqual({
      count: 2,
      criados: 0,
      atualizados: 2,
      removidos: 0
    });
  });

  it('preserva o id da linha, que é o que mantém o vínculo da aula', async () => {
    repo.entity.findMany = async () => [{ id: 'c-1', ordem: 1 }];

    await repo.substituirByLivro('livro-1', dadosNovos(1));

    expect(chamadas.update[0].where).toEqual({ id: 'c-1' });
    expect(chamadas.update[0].data).toEqual({
      titulo: 'Unit 1',
      descricao: null
    });
  });

  it('cria apenas as ordens que ainda não existem', async () => {
    repo.entity.findMany = async () => [{ id: 'c-1', ordem: 1 }];

    const resultado = await repo.substituirByLivro('livro-1', dadosNovos(3));

    expect(chamadas.update).toHaveLength(1);
    expect(chamadas.create).toHaveLength(2);
    expect(resultado.criados).toBe(2);
    expect(resultado.atualizados).toBe(1);
  });

  it('remove apenas as ordens excedentes quando a planilha encurta', async () => {
    repo.entity.findMany = async () => [
      { id: 'c-1', ordem: 1 },
      { id: 'c-2', ordem: 2 },
      { id: 'c-3', ordem: 3 }
    ];

    const resultado = await repo.substituirByLivro('livro-1', dadosNovos(1));

    expect(chamadas.deleteMany).toHaveLength(1);
    expect(chamadas.deleteMany[0].where).toEqual({
      id: { in: ['c-2', 'c-3'] }
    });
    expect(resultado.removidos).toBe(2);
  });

  it('cria tudo quando o livro ainda não tem conteúdo', async () => {
    repo.entity.findMany = async () => [];

    const resultado = await repo.substituirByLivro('livro-1', dadosNovos(2));

    expect(chamadas.create).toHaveLength(2);
    expect(chamadas.update).toHaveLength(0);
    expect(resultado).toEqual({
      count: 2,
      criados: 2,
      atualizados: 0,
      removidos: 0
    });
  });
});

describe('ConteudoLivroRepository.selectAcimaDaOrdem', () => {
  it('filtra pelas ordens acima do limite, em ordem', async () => {
    const repo = new ConteudoLivroRepository();
    let recebido = null;
    repo.entity.findMany = async args => {
      recebido = args;
      return [];
    };

    await repo.selectAcimaDaOrdem('livro-1', 5);

    expect(recebido.where).toEqual({ idLivro: 'livro-1', ordem: { gt: 5 } });
    expect(recebido.orderBy).toEqual({ ordem: 'asc' });
  });
});
