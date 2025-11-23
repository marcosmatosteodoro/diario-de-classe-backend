import { jest } from '@jest/globals';
import AbstractRepository from '../../../src/repositories/abstractRepository.js';
describe('AbstractRepository', () => {
  class MockRepository extends AbstractRepository {
    getEntity() {
      return {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
      };
    }

    getSelectFields() {
      return { id: true };
    }
  }

  let repository;

  beforeEach(() => {
    repository = new MockRepository();
  });

  describe('Implementação obrigatória', () => {
    test('getEntity deve lançar erro se não implementado', () => {
      class RepoSemEntidade extends AbstractRepository {}

      expect(() => new RepoSemEntidade().getEntity()).toThrow(
        'Método getEntity() deve ser implementado na subclasse'
      );
    });

    test('getSelectFields deve lançar erro se não implementado', () => {
      class RepoSemSelect extends AbstractRepository {
        getEntity() {
          return {};
        }
      }

      expect(() => new RepoSemSelect().getSelectFields()).toThrow(
        'Método getSelectFields() deve ser implementado na subclasse'
      );
    });
  });

  describe('Inicialização', () => {
    test('entity deve ser definido no construtor', () => {
      expect(repository.entity).toBeDefined();
      expect(typeof repository.entity.findMany).toBe('function');
    });

    test('selectFields deve ser definido no construtor', () => {
      expect(repository.selectFields).toEqual({ id: true });
    });
  });

  describe('Métodos CRUD', () => {
    test('selectMany deve chamar entity.findMany', async () => {
      repository.entity.findMany.mockResolvedValue([]);

      await repository.selectMany({ where: { id: 1 } });

      expect(repository.entity.findMany).toHaveBeenCalledWith({
        where: { id: 1 },
        select: undefined,
        orderBy: undefined,
        skip: undefined,
        take: undefined
      });
    });

    test('selectOne deve lançar erro sem where', async () => {
      await expect(repository.selectOne({})).rejects.toThrow(
        'Condições de busca (where) são obrigatórias'
      );
    });

    test('selectOne deve chamar entity.findFirst', async () => {
      repository.entity.findFirst.mockResolvedValue({ id: 1 });

      await repository.selectOne({ where: { id: 1 } });

      expect(repository.entity.findFirst).toHaveBeenCalledWith({
        where: { id: 1 },
        select: undefined
      });
    });

    test('create deve chamar entity.create', async () => {
      repository.entity.create.mockResolvedValue({ id: 1 });

      await repository.create({ nome: 'Teste' });

      expect(repository.entity.create).toHaveBeenCalledWith({
        data: { nome: 'Teste' },
        select: undefined
      });
    });

    test('update deve chamar entity.update', async () => {
      repository.entity.update.mockResolvedValue({ id: 1 });

      await repository.update({ id: 1 }, { nome: 'Novo' });

      expect(repository.entity.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { nome: 'Novo' },
        select: undefined
      });
    });

    test('delete deve chamar entity.delete', async () => {
      repository.entity.delete.mockResolvedValue({ id: 1 });

      await repository.delete({ id: 1 });

      expect(repository.entity.delete).toHaveBeenCalledWith({
        where: { id: 1 },
        select: undefined
      });
    });
  });
});
