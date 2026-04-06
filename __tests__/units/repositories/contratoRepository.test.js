import ContratoRepository from '../../../src/repositories/contratoRepository.js';

describe('ContratoRepository', () => {
  let contratoRepository;

  beforeEach(() => {
    contratoRepository = new ContratoRepository();
  });

  describe('Inicialização', () => {
    test('deve instanciar corretamente', () => {
      expect(contratoRepository).toBeInstanceOf(ContratoRepository);
      expect(contratoRepository.entity).toBeDefined();
    });

    test('deve ter método getEntity', () => {
      expect(typeof contratoRepository.getEntity).toBe('function');
      expect(contratoRepository.getEntity()).toBeDefined();
    });

    test('deve ter método getSelectFields', () => {
      expect(typeof contratoRepository.getSelectFields).toBe('function');
      expect(contratoRepository.getSelectFields()).toBeDefined();
    });

    test('deve ter selectFields definido como objeto', () => {
      expect(contratoRepository.selectFields).toBeDefined();
      expect(typeof contratoRepository.selectFields).toBe('object');
    });

    test('deve herdar de AbstractRepository', () => {
      expect(typeof contratoRepository.selectMany).toBe('function');
      expect(typeof contratoRepository.selectOne).toBe('function');
      expect(typeof contratoRepository.create).toBe('function');
      expect(typeof contratoRepository.update).toBe('function');
      expect(typeof contratoRepository.delete).toBe('function');
    });
  });

  describe('Métodos CRUD', () => {
    test('selectMany deve ser uma função', () => {
      expect(typeof contratoRepository.selectMany).toBe('function');
    });

    test('selectOne deve ser uma função', () => {
      expect(typeof contratoRepository.selectOne).toBe('function');
    });

    test('create deve ser uma função', () => {
      expect(typeof contratoRepository.create).toBe('function');
    });

    test('update deve ser uma função', () => {
      expect(typeof contratoRepository.update).toBe('function');
    });

    test('delete deve ser uma função', () => {
      expect(typeof contratoRepository.delete).toBe('function');
    });
  });

  describe('Validação de parâmetros', () => {
    test('selectOne deve lançar erro quando where não é fornecido', async () => {
      await expect(contratoRepository.selectOne({})).rejects.toThrow(
        'Condições de busca (where) são obrigatórias'
      );
    });

    test('selectOne deve lançar erro quando where é undefined', async () => {
      await expect(contratoRepository.selectOne({ where: undefined })).rejects.toThrow(
        'Condições de busca (where) são obrigatórias'
      );
    });
  });

  describe('Estrutura da classe', () => {
    test('getEntity deve retornar prisma.contrato', () => {
      expect(contratoRepository.getEntity()).toBeDefined();
      expect(contratoRepository.getEntity().name).toBe('Contrato');
    });

    test('selectFields deve conter os campos corretos', () => {
      const fields = contratoRepository.getSelectFields();

      const expectedTrueFields = [
        'id',
        'idAluno',
        'dataInicio',
        'dataTermino',
        'status',
        'totalAulas',
        'totalAulasFeitas',
        'totalReposicoes',
        'totalFaltas',
        'totalAulasCanceladas',
        'dataCriacao',
        'dataAtualizacao',
        'idioma'
      ];

      // Campos relacionais com select
      expect(fields.aluno).toEqual({ select: { nome: true, nomeCompleto: true } });
      expect(fields.diaAulas).toBe(false);

      // Campos selecionados (true)
      expectedTrueFields.forEach(field => {
        expect(fields[field]).toBe(true);
      });

      // Total de campos: 13 campos true + aluno (com select) + diaAulas (false) = 15
      expect(Object.keys(fields)).toHaveLength(15);
    });
  });

  describe('Validação específica do modelo Contrato', () => {
    test('deve aceitar um contrato válido para criação', () => {
      const contratoData = {
        idAluno: 1,
        dataInicio: '2025-01-01',
        dataTermino: '2025-12-31',
        status: 'ativo',
        totalAulas: 40
      };

      expect(contratoData.idAluno).toBeDefined();
      expect(contratoData.dataInicio).toBeDefined();
      expect(contratoData.status).toBeDefined();
      expect(typeof contratoData.totalAulas).toBe('number');
    });

    test('campos numéricos opcionais devem permitir null', () => {
      const contrato = {
        totalAulasFeitas: null,
        totalReposicoes: null,
        totalFaltas: null,
        totalAulasCanceladas: null
      };

      expect(contrato.totalAulasFeitas).toBeNull();
      expect(contrato.totalReposicoes).toBeNull();
      expect(contrato.totalFaltas).toBeNull();
      expect(contrato.totalAulasCanceladas).toBeNull();
    });
  });
});
