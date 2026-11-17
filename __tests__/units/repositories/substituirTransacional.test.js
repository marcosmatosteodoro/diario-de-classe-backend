import { jest } from '@jest/globals';

const clientGlobal = {
  configuracao: { deleteMany: jest.fn(), create: jest.fn() },
  diaDeFuncionamento: { deleteMany: jest.fn(), create: jest.fn() },
  $transaction: jest.fn()
};

jest.unstable_mockModule('../../../src/db/prisma.js', () => ({ default: clientGlobal }));

const { default: ConfiguracaoRepository } = await import(
  '../../../src/repositories/configuracaoRepository.js'
);
const { default: DiaDeFuncionamentoRepository } = await import(
  '../../../src/repositories/diaDeFuncionamentoRepository.js'
);

/** Client transacional falso, entregue ao callback de $transaction. */
const prepararTransacao = modelo => {
  const tx = {
    [modelo]: {
      deleteMany: jest.fn().mockResolvedValue({ count: 2 }),
      create: jest.fn()
    }
  };
  clientGlobal.$transaction.mockImplementation(async fn => fn(tx));
  return {
    tx,
    globalDeleteMany: clientGlobal[modelo].deleteMany,
    globalCreate: clientGlobal[modelo].create
  };
};

describe('ConfiguracaoRepository.substituir', () => {
  test('remove e cria no client da transação, com select', async () => {
    const { tx, globalDeleteMany, globalCreate } = prepararTransacao('configuracao');
    tx.configuracao.create.mockResolvedValue({ id: 'novo' });
    const repo = new ConfiguracaoRepository();
    const data = { duracaoAula: 40, tolerancia: 10 };

    const result = await repo.substituir(['a', 'b'], data);

    expect(result).toEqual({ id: 'novo' });
    expect(tx.configuracao.deleteMany).toHaveBeenCalledWith({ where: { id: { in: ['a', 'b'] } } });
    expect(tx.configuracao.create).toHaveBeenCalledWith({
      data,
      select: repo.getSelectFields()
    });
    expect(globalDeleteMany).not.toHaveBeenCalled();
    expect(globalCreate).not.toHaveBeenCalled();
  });

  test('delete antes do create dentro da transação', async () => {
    const { tx } = prepararTransacao('configuracao');
    const ordem = [];
    tx.configuracao.deleteMany.mockImplementation(async () => {
      await Promise.resolve();
      ordem.push('delete');
    });
    tx.configuracao.create.mockImplementation(async () => {
      ordem.push('create');
    });

    await new ConfiguracaoRepository().substituir(['a'], {});

    expect(ordem).toEqual(['delete', 'create']);
  });

  test('erro no create rejeita a operação', async () => {
    const { tx } = prepararTransacao('configuracao');
    tx.configuracao.create.mockRejectedValue(new Error('falha-create'));

    await expect(new ConfiguracaoRepository().substituir(['a'], {})).rejects.toThrow(
      'falha-create'
    );
  });
});

describe('DiaDeFuncionamentoRepository.substituir', () => {
  const lista = [
    { diaSemana: 'SEGUNDA', configuracaoId: 'c' },
    { diaSemana: 'TERCA', configuracaoId: 'c' }
  ];

  test('remove e cria cada dia no client da transação, na ordem', async () => {
    const { tx, globalDeleteMany, globalCreate } = prepararTransacao('diaDeFuncionamento');
    tx.diaDeFuncionamento.create.mockImplementation(async ({ data }) => ({ id: data.diaSemana }));
    const repo = new DiaDeFuncionamentoRepository();

    const result = await repo.substituir(['x'], lista);

    expect(result).toEqual([{ id: 'SEGUNDA' }, { id: 'TERCA' }]);
    expect(tx.diaDeFuncionamento.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ['x'] } }
    });
    expect(tx.diaDeFuncionamento.create.mock.calls.map(c => c[0])).toEqual(
      lista.map(data => ({ data, select: repo.getSelectFields() }))
    );
    expect(globalDeleteMany).not.toHaveBeenCalled();
    expect(globalCreate).not.toHaveBeenCalled();
  });

  test('delete resolvido antes do primeiro create dentro da transação', async () => {
    const { tx } = prepararTransacao('diaDeFuncionamento');
    const ordem = [];
    tx.diaDeFuncionamento.deleteMany.mockImplementation(async () => {
      await Promise.resolve();
      ordem.push('delete');
    });
    tx.diaDeFuncionamento.create.mockImplementation(async () => {
      ordem.push('create');
    });

    await new DiaDeFuncionamentoRepository().substituir(['x'], lista);

    expect(ordem).toEqual(['delete', 'create', 'create']);
  });

  test('erro em um create rejeita a operação', async () => {
    const { tx } = prepararTransacao('diaDeFuncionamento');
    tx.diaDeFuncionamento.create
      .mockResolvedValueOnce({ id: '1' })
      .mockRejectedValueOnce(new Error('falha-create'));

    await expect(new DiaDeFuncionamentoRepository().substituir(['x'], lista)).rejects.toThrow(
      'falha-create'
    );
  });
});
