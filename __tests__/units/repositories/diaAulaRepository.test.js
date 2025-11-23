import DiaAulaRepository from '../../../src/repositories/diaAulaRepository.js';

describe('DiaAulaRepository', () => {
  let diaAulaRepository;

  beforeEach(() => {
    diaAulaRepository = new DiaAulaRepository();
  });

  describe('Inicialização', () => {
    test('deve instanciar corretamente', () => {
      expect(diaAulaRepository).toBeInstanceOf(DiaAulaRepository);
      expect(diaAulaRepository.entity).toBeDefined();
    });

    test('deve ter método getEntity', () => {
      expect(typeof diaAulaRepository.getEntity).toBe('function');
      expect(diaAulaRepository.getEntity()).toBeDefined();
    });

    test('deve ter método getSelectFields', () => {
      expect(typeof diaAulaRepository.getSelectFields).toBe('function');
      expect(diaAulaRepository.getSelectFields()).toBeDefined();
    });

    test('deve ter selectFields definido como objeto', () => {
      expect(diaAulaRepository.selectFields).toBeDefined();
      expect(typeof diaAulaRepository.selectFields).toBe('object');
    });

    test('deve herdar de AbstractRepository', () => {
      expect(typeof diaAulaRepository.selectMany).toBe('function');
      expect(typeof diaAulaRepository.selectOne).toBe('function');
      expect(typeof diaAulaRepository.create).toBe('function');
      expect(typeof diaAulaRepository.update).toBe('function');
      expect(typeof diaAulaRepository.delete).toBe('function');
    });
  });

  describe('Métodos CRUD', () => {
    test('selectMany deve ser uma função', () => {
      expect(typeof diaAulaRepository.selectMany).toBe('function');
    });

    test('selectOne deve ser uma função', () => {
      expect(typeof diaAulaRepository.selectOne).toBe('function');
    });

    test('create deve ser uma função', () => {
      expect(typeof diaAulaRepository.create).toBe('function');
    });

    test('update deve ser uma função', () => {
      expect(typeof diaAulaRepository.update).toBe('function');
    });

    test('delete deve ser uma função', () => {
      expect(typeof diaAulaRepository.delete).toBe('function');
    });
  });

  describe('Validação do método selectOne', () => {
    test('deve lançar erro quando where não for fornecido', async () => {
      await expect(diaAulaRepository.selectOne({})).rejects.toThrow(
        'Condições de busca (where) são obrigatórias'
      );
    });

    test('deve lançar erro quando where é undefined', async () => {
      await expect(diaAulaRepository.selectOne({ where: undefined })).rejects.toThrow(
        'Condições de busca (where) são obrigatórias'
      );
    });
  });

  describe('Estrutura dos campos', () => {
    test('getEntity deve retornar prisma.diaAula', () => {
      expect(diaAulaRepository.getEntity()).toBeDefined();
      expect(diaAulaRepository.getEntity().name).toBe('DiaAula');
    });

    test('selectFields deve conter os campos corretos', () => {
      const fields = diaAulaRepository.getSelectFields();

      const expectedFields = [
        'id',
        'idAluno',
        'idContrato',
        'diaSemana',
        'quantidadeAulas',
        'horaInicial',
        'horaFinal',
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
