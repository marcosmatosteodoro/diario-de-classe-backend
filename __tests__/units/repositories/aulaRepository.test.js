import AulaRepository from '../../../src/repositories/aulaRepository.js';

describe('AulaRepository', () => {
  let aulaRepository;

  beforeEach(() => {
    aulaRepository = new AulaRepository();
  });

  describe('Inicialização', () => {
    test('deve instanciar corretamente', () => {
      expect(aulaRepository).toBeInstanceOf(AulaRepository);
      expect(aulaRepository.entity).toBeDefined();
    });

    test('deve ter método getEntity', () => {
      expect(typeof aulaRepository.getEntity).toBe('function');
      expect(aulaRepository.getEntity()).toBeDefined();
    });

    test('deve ter método getSelectFields', () => {
      expect(typeof aulaRepository.getSelectFields).toBe('function');
      expect(aulaRepository.getSelectFields()).toBeDefined();
    });

    test('selectFields deve ser um objeto', () => {
      expect(aulaRepository.selectFields).toBeDefined();
      expect(typeof aulaRepository.selectFields).toBe('object');
    });

    test('deve herdar os métodos CRUD do AbstractRepository', () => {
      expect(typeof aulaRepository.selectMany).toBe('function');
      expect(typeof aulaRepository.selectOne).toBe('function');
      expect(typeof aulaRepository.create).toBe('function');
      expect(typeof aulaRepository.update).toBe('function');
      expect(typeof aulaRepository.delete).toBe('function');
    });
  });

  describe('Métodos CRUD', () => {
    test('selectMany deve ser uma função', () => {
      expect(typeof aulaRepository.selectMany).toBe('function');
    });

    test('selectOne deve ser uma função', () => {
      expect(typeof aulaRepository.selectOne).toBe('function');
    });

    test('create deve ser uma função', () => {
      expect(typeof aulaRepository.create).toBe('function');
    });

    test('update deve ser uma função', () => {
      expect(typeof aulaRepository.update).toBe('function');
    });

    test('delete deve ser uma função', () => {
      expect(typeof aulaRepository.delete).toBe('function');
    });
  });

  describe('Validação do método selectOne', () => {
    test('deve lançar erro quando where não for fornecido', async () => {
      await expect(aulaRepository.selectOne({})).rejects.toThrow(
        'Condições de busca (where) são obrigatórias'
      );
    });

    test('deve lançar erro quando where é undefined', async () => {
      await expect(aulaRepository.selectOne({ where: undefined })).rejects.toThrow(
        'Condições de busca (where) são obrigatórias'
      );
    });
  });

  describe('Estrutura dos campos', () => {
    test('getSelectFieldsWithRelations deve conter os campos corretos e relações', () => {
      const fields = aulaRepository.getSelectFieldsWithRelations();

      const expectedFields = [
        'id',
        'idAluno',
        'idProfessor',
        'idContrato',
        'dataAula',
        'horaInicial',
        'horaFinal',
        'duracaoAula',
        'tipo',
        'status',
        'observacao',
        'aluno',
        'professor',
        'contrato',
        'dataCriacao',
        'dataAtualizacao'
      ];

      expectedFields.forEach(key => {
        expect(fields[key]).toBe(true);
      });

      expect(Object.keys(fields)).toHaveLength(expectedFields.length);
    });
    test('getEntity deve retornar a entidade prisma.aula', () => {
      expect(aulaRepository.getEntity()).toBeDefined();
      expect(aulaRepository.getEntity().name).toBe('Aula');
    });

    test('selectFields deve conter os campos corretos', () => {
      const fields = aulaRepository.getSelectFields();

      const expectedFields = [
        'id',
        'idAluno',
        'idProfessor',
        'idContrato',
        'dataAula',
        'horaInicial',
        'horaFinal',
        'duracaoAula',
        'tipo',
        'status',
        'observacao',
        'dataCriacao',
        'dataAtualizacao'
      ];

      expectedFields.forEach(key => {
        expect(fields[key]).toBe(true);
      });

      expect(Object.keys(fields)).toHaveLength(expectedFields.length);
    });
  });
});
