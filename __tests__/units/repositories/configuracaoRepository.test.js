import ConfiguracaoRepository from '../../../src/repositories/configuracaoRepository.js';

describe('ConfiguracaoRepository', () => {
  let configuracaoRepository;

  beforeEach(() => {
    configuracaoRepository = new ConfiguracaoRepository();
  });

  describe('Inicialização', () => {
    test('deve instanciar corretamente', () => {
      expect(configuracaoRepository).toBeInstanceOf(ConfiguracaoRepository);
      expect(configuracaoRepository.entity).toBeDefined();
    });

    test('deve ter método getEntity', () => {
      expect(typeof configuracaoRepository.getEntity).toBe('function');
      expect(configuracaoRepository.getEntity()).toBeDefined();
    });

    test('deve ter método getSelectFields', () => {
      expect(typeof configuracaoRepository.getSelectFields).toBe('function');
      expect(configuracaoRepository.getSelectFields()).toBeDefined();
    });

    test('deve ter propriedade selectFields definida', () => {
      expect(configuracaoRepository.selectFields).toBeDefined();
      expect(typeof configuracaoRepository.selectFields).toBe('object');
    });

    test('deve herdar de AbstractRepository', () => {
      expect(typeof configuracaoRepository.selectMany).toBe('function');
      expect(typeof configuracaoRepository.selectOne).toBe('function');
      expect(typeof configuracaoRepository.create).toBe('function');
      expect(typeof configuracaoRepository.update).toBe('function');
      expect(typeof configuracaoRepository.delete).toBe('function');
    });
  });

  describe('Métodos CRUD', () => {
    test('selectMany deve ser uma função', () => {
      expect(typeof configuracaoRepository.selectMany).toBe('function');
    });

    test('selectOne deve ser uma função', () => {
      expect(typeof configuracaoRepository.selectOne).toBe('function');
    });

    test('create deve ser uma função', () => {
      expect(typeof configuracaoRepository.create).toBe('function');
    });

    test('update deve ser uma função', () => {
      expect(typeof configuracaoRepository.update).toBe('function');
    });

    test('delete deve ser uma função', () => {
      expect(typeof configuracaoRepository.delete).toBe('function');
    });
  });

  describe('Validação de parâmetros', () => {
    test('selectOne deve lançar erro quando where não é fornecido', async () => {
      await expect(configuracaoRepository.selectOne({})).rejects.toThrow(
        'Condições de busca (where) são obrigatórias'
      );
    });

    test('selectOne deve lançar erro quando where é undefined', async () => {
      await expect(configuracaoRepository.selectOne({ where: undefined })).rejects.toThrow(
        'Condições de busca (where) são obrigatórias'
      );
    });
  });

  describe('Estrutura da classe', () => {
    test('deve ter propriedade entity definida', () => {
      expect(configuracaoRepository.entity).toBeDefined();
      expect(configuracaoRepository.entity).toBeTruthy();
    });

    test('getEntity deve retornar a mesma entidade que entity', () => {
      expect(configuracaoRepository.getEntity()).toBe(configuracaoRepository.entity);
    });

    test('getSelectFields deve retornar os mesmos campos que selectFields', () => {
      expect(configuracaoRepository.getSelectFields()).toEqual(configuracaoRepository.selectFields);
    });

    test('selectFields deve conter campos corretos para configuracao', () => {
      const fields = configuracaoRepository.selectFields;

      expect(fields.id).toBe(true);
      expect(fields.duracaoAula).toBe(true);
      expect(fields.tolerancia).toBe(true);
      expect(fields.diasDeFuncionamento).toBe(true);

      // Espera 4 campos expostos
      expect(Object.keys(fields)).toHaveLength(4);
    });

    test('deve ter todos os métodos CRUD disponíveis', () => {
      const methods = ['selectMany', 'selectOne', 'create', 'update', 'delete'];
      methods.forEach(method => {
        expect(configuracaoRepository[method]).toBeDefined();
        expect(typeof configuracaoRepository[method]).toBe('function');
      });
    });

    test('deve ter entity específica para configuracao', () => {
      const entity = configuracaoRepository.getEntity();
      expect(entity).toBeDefined();
      expect(entity.name).toBe('Configuracao');
    });

    test('campos específicos do modelo Configuracao devem estar configurados', () => {
      const fields = configuracaoRepository.getSelectFields();

      expect(fields.duracaoAula).toBe(true);
      expect(fields.tolerancia).toBe(true);
      expect(fields.diasDeFuncionamento).toBe(true);
    });
  });
});
