import { jest } from '@jest/globals';

const queryRaw = jest.fn();
const entity = { findUnique: jest.fn(), deleteMany: jest.fn() };

jest.unstable_mockModule('../../../src/db/prisma.js', () => ({
  default: { $queryRaw: queryRaw, tentativaLogin: entity }
}));

const { default: TentativaLoginRepository } = await import(
  '../../../src/repositories/tentativaLoginRepository.js'
);

describe('TentativaLoginRepository', () => {
  let repository;

  beforeEach(() => {
    repository = new TentativaLoginRepository();
  });

  describe('incrementar', () => {
    test('usa uma única instrução $queryRaw parametrizada (tagged template), com upsert atômico', async () => {
      const linha = { contagem: 3, expiraEm: new Date() };
      queryRaw.mockResolvedValue([linha]);

      const resultado = await repository.incrementar('ip:203.0.113.10', 900);

      expect(resultado).toBe(linha);
      expect(queryRaw).toHaveBeenCalledTimes(1);
      const [strings, ...valores] = queryRaw.mock.calls[0];
      const sql = strings.join('?');
      expect(Array.isArray(strings.raw)).toBe(true);
      expect(sql).toContain('ON CONFLICT ("chave") DO UPDATE');
      expect(sql).toContain('"expiraEm" <= NOW()');
      expect(sql).toContain('RETURNING');
      expect(valores).toContain('ip:203.0.113.10');
      expect(valores.filter(v => v === 900)).toHaveLength(2);
      expect(sql).not.toContain('ip:203.0.113.10');
      expect(sql).not.toContain('900');
    });

    test('propaga o erro do banco (quem chama nega o login)', async () => {
      queryRaw.mockRejectedValue(new Error('db fora'));

      await expect(repository.incrementar('k', 900)).rejects.toThrow('db fora');
    });
  });

  test('buscarPorChave consulta pela chave única com select limitado', async () => {
    entity.findUnique.mockResolvedValue({ contagem: 2, expiraEm: new Date() });

    await repository.buscarPorChave('k');

    expect(entity.findUnique).toHaveBeenCalledWith({
      where: { chave: 'k' },
      select: { contagem: true, expiraEm: true }
    });
  });

  test('removerPorChave usa deleteMany (chave inexistente não lança)', async () => {
    entity.deleteMany.mockResolvedValue({ count: 0 });

    await repository.removerPorChave('k');

    expect(entity.deleteMany).toHaveBeenCalledWith({ where: { chave: 'k' } });
  });
});
