import DiaDeFuncionamentoRepository from '../../../src/repositories/diaDeFuncionamentoRepository.js';

describe('DiaDeFuncionamentoRepository', () => {
  let repo;

  beforeEach(() => {
    repo = new DiaDeFuncionamentoRepository();
  });

  describe('Inicialização', () => {
    test('deve instanciar corretamente', () => {
      expect(repo).toBeInstanceOf(DiaDeFuncionamentoRepository);
      expect(repo.entity).toBeDefined();
    });

    test('deve ter método getEntity', () => {
      expect(typeof repo.getEntity).toBe('function');
      expect(repo.getEntity()).toBeDefined();
    });

    test('deve ter método getSelectFields', () => {
      expect(typeof repo.getSelectFields).toBe('function');
      expect(repo.getSelectFields()).toBeDefined();
    });

    test('deve ter propriedade selectFields definida', () => {
      expect(repo.selectFields).toBeDefined();
      expect(typeof repo.selectFields).toBe('object');
    });

    test('deve herdar de AbstractRepository', () => {
      expect(typeof repo.selectMany).toBe('function');
      expect(typeof repo.selectOne).toBe('function');
      expect(typeof repo.create).toBe('function');
      expect(typeof repo.update).toBe('function');
      expect(typeof repo.delete).toBe('function');
    });
  });

  describe('Métodos CRUD', () => {
    test('selectMany deve ser uma função', () => {
      expect(typeof repo.selectMany).toBe('function');
    });

    test('selectOne deve ser uma função', () => {
      expect(typeof repo.selectOne).toBe('function');
    });

    test('create deve ser uma função', () => {
      expect(typeof repo.create).toBe('function');
    });

    test('update deve ser uma função', () => {
      expect(typeof repo.update).toBe('function');
    });

    test('delete deve ser uma função', () => {
      expect(typeof repo.delete).toBe('function');
    });
  });

  describe('Validação de parâmetros', () => {
    test('selectOne deve lançar erro quando where não é fornecido', async () => {
      await expect(repo.selectOne({})).rejects.toThrow(
        'Condições de busca (where) são obrigatórias'
      );
    });

    test('selectOne deve lançar erro quando where é undefined', async () => {
      await expect(repo.selectOne({ where: undefined })).rejects.toThrow(
        'Condições de busca (where) são obrigatórias'
      );
    });
  });

  describe('Estrutura da classe', () => {
    test('deve ter propriedade entity definida', () => {
      expect(repo.entity).toBeDefined();
      expect(repo.entity).toBeTruthy();
    });

    test('getEntity deve retornar a mesma entidade que entity', () => {
      expect(repo.getEntity()).toBe(repo.entity);
    });

    test('getSelectFields deve retornar os mesmos campos que selectFields', () => {
      expect(repo.getSelectFields()).toEqual(repo.selectFields);
    });

    test('selectFields deve conter campos corretos para dia de funcionamento', () => {
      const fields = repo.selectFields;

      expect(fields.id).toBe(true);
      expect(fields.diaSemana).toBe(true);
      expect(fields.horaInicial).toBe(true);
      expect(fields.horaFinal).toBe(true);
      expect(fields.ativo).toBe(true);
      expect(fields.configuracaoId).toBe(true);

      // Espera 6 campos expostos
      expect(Object.keys(fields)).toHaveLength(6);
    });

    test('deve ter todos os métodos CRUD disponíveis', () => {
      const methods = ['selectMany', 'selectOne', 'create', 'update', 'delete'];
      methods.forEach(method => {
        expect(repo[method]).toBeDefined();
        expect(typeof repo[method]).toBe('function');
      });
    });

    test('deve ter entity específica para diaDeFuncionamento', () => {
      const entity = repo.getEntity();
      expect(entity).toBeDefined();
      expect(entity.name).toBe('DiaDeFuncionamento');
    });

    test('campos específicos do modelo DiaDeFuncionamento devem estar configurados', () => {
      const fields = repo.getSelectFields();

      expect(fields.diaSemana).toBe(true);
      expect(fields.horaInicial).toBe(true);
      expect(fields.horaFinal).toBe(true);
      expect(fields.ativo).toBe(true);
    });
  });
});
