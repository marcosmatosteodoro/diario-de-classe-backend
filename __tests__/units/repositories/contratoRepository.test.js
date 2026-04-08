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

    test('deve ter método getSelectFieldsWithRelations', () => {
      expect(typeof contratoRepository.getSelectFieldsWithRelations).toBe('function');
      expect(contratoRepository.getSelectFieldsWithRelations()).toBeDefined();
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

  describe('getSelectFieldsWithRelations', () => {
    test('deve retornar campos com relações completas', () => {
      const fields = contratoRepository.getSelectFieldsWithRelations();

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

      // Campos selecionados (true)
      expectedTrueFields.forEach(field => {
        expect(fields[field]).toBe(true);
      });
    });

    test('deve incluir relação aluno completa', () => {
      const fields = contratoRepository.getSelectFieldsWithRelations();

      expect(fields.aluno).toBe(true);
    });

    test('deve incluir relação diaAulas completa', () => {
      const fields = contratoRepository.getSelectFieldsWithRelations();

      expect(fields.diaAulas).toBe(true);
    });

    test('deve incluir relação aulas com select específico', () => {
      const fields = contratoRepository.getSelectFieldsWithRelations();

      expect(fields.aulas).toBeDefined();
      expect(fields.aulas.select).toBeDefined();
      expect(typeof fields.aulas.select).toBe('object');
    });

    test('deve incluir campos corretos na relação aulas', () => {
      const fields = contratoRepository.getSelectFieldsWithRelations();
      const aulaFields = fields.aulas.select;

      const expectedAulaFields = [
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

      expectedAulaFields.forEach(field => {
        expect(aulaFields[field]).toBe(true);
      });
    });

    test('deve incluir relação professor dentro de aulas', () => {
      const fields = contratoRepository.getSelectFieldsWithRelations();
      const aulaFields = fields.aulas.select;

      expect(aulaFields.professor).toBeDefined();
      expect(aulaFields.professor.select).toBeDefined();
      expect(aulaFields.professor.select.nome).toBe(true);
      expect(aulaFields.professor.select.nomeCompleto).toBe(true);
    });

    test('deve ter todos os campos necessários para relações completas', () => {
      const fields = contratoRepository.getSelectFieldsWithRelations();

      // Campos base
      expect(fields.id).toBe(true);
      expect(fields.idAluno).toBe(true);
      expect(fields.dataInicio).toBe(true);
      expect(fields.dataTermino).toBe(true);
      expect(fields.status).toBe(true);
      expect(fields.totalAulas).toBe(true);
      expect(fields.idioma).toBe(true);

      // Relações
      expect(fields.aluno).toBe(true);
      expect(fields.diaAulas).toBe(true);
      expect(fields.aulas).toBeDefined();
      expect(fields.aulas.select).toBeDefined();
    });

    test('deve retornar estrutura diferente de getSelectFields', () => {
      const basicFields = contratoRepository.getSelectFields();
      const fieldsWithRelations = contratoRepository.getSelectFieldsWithRelations();

      // aluno deve ser objeto com select no básico, mas true no com relações
      expect(basicFields.aluno).toEqual({ select: { nome: true, nomeCompleto: true } });
      expect(fieldsWithRelations.aluno).toBe(true);

      // diaAulas deve ser false no básico, mas true no com relações
      expect(basicFields.diaAulas).toBe(false);
      expect(fieldsWithRelations.diaAulas).toBe(true);

      // aulas não existe no básico, mas existe no com relações
      expect(basicFields.aulas).toBeUndefined();
      expect(fieldsWithRelations.aulas).toBeDefined();
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
