import UserRepository from '../../../src/repositories/userRepository.js';

describe('UserRepository', () => {
  let userRepository;

  beforeEach(() => {
    userRepository = new UserRepository();
  });

  describe('Inicialização', () => {
    test('deve instanciar corretamente', () => {
      expect(userRepository).toBeInstanceOf(UserRepository);
      expect(userRepository.entity).toBeDefined();
    });

    test('deve ter método getEntity', () => {
      expect(typeof userRepository.getEntity).toBe('function');
      expect(userRepository.getEntity()).toBeDefined();
    });

    test('deve herdar de AbstractRepository', () => {
      expect(typeof userRepository.selectMany).toBe('function');
      expect(typeof userRepository.selectOne).toBe('function');
      expect(typeof userRepository.create).toBe('function');
      expect(typeof userRepository.update).toBe('function');
      expect(typeof userRepository.delete).toBe('function');
    });
  });

  describe('Métodos CRUD', () => {
    test('selectMany deve ser uma função', () => {
      expect(typeof userRepository.selectMany).toBe('function');
    });

    test('selectOne deve ser uma função', () => {
      expect(typeof userRepository.selectOne).toBe('function');
    });

    test('create deve ser uma função', () => {
      expect(typeof userRepository.create).toBe('function');
    });

    test('update deve ser uma função', () => {
      expect(typeof userRepository.update).toBe('function');
    });

    test('delete deve ser uma função', () => {
      expect(typeof userRepository.delete).toBe('function');
    });
  });

  describe('Validação de parâmetros', () => {
    test('selectOne deve lançar erro quando where não é fornecido', async () => {
      await expect(userRepository.selectOne({})).rejects.toThrow(
        'Condições de busca (where) são obrigatórias'
      );
    });

    test('selectOne deve lançar erro quando where é undefined', async () => {
      await expect(userRepository.selectOne({ where: undefined })).rejects.toThrow(
        'Condições de busca (where) são obrigatórias'
      );
    });
  });

  describe('Estrutura da classe', () => {
    test('deve ter propriedade entity definida', () => {
      expect(userRepository.entity).toBeDefined();
      expect(userRepository.entity).toBeTruthy();
    });

    test('getEntity deve retornar a mesma entidade que entity', () => {
      expect(userRepository.getEntity()).toBe(userRepository.entity);
    });

    test('deve ter todos os métodos CRUD disponíveis', () => {
      const methods = ['selectMany', 'selectOne', 'create', 'update', 'delete'];
      methods.forEach(method => {
        expect(userRepository[method]).toBeDefined();
        expect(typeof userRepository[method]).toBe('function');
      });
    });
  });
});
