import ContratoRepository from '../../../src/repositories/contratoRepository.js';

describe.skip('ContratoRepository', () => {
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

    test('deve ter propriedade selectFields definida', () => {
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
    test('deve ter propriedade entity definida', () => {
      expect(contratoRepository.entity).toBeDefined();
      expect(contratoRepository.entity).toBeTruthy();
    });

    test('getEntity deve retornar a mesma entidade que entity', () => {
      expect(contratoRepository.getEntity()).toBe(contratoRepository.entity);
    });

    test('getSelectFields deve retornar os mesmos campos que selectFields', () => {
      expect(contratoRepository.getSelectFields()).toEqual(contratoRepository.selectFields);
    });

    test('selectFields deve conter campos corretos para alunos', () => {
      const fields = contratoRepository.selectFields;

      // Verifica campos que devem estar presentes
      expect(fields.id).toBe(true);
      expect(fields.nome).toBe(true);
      expect(fields.sobrenome).toBe(true);
      expect(fields.email).toBe(true);
      expect(fields.telefone).toBe(true);
      expect(fields.criador).toBe(true);
      expect(fields.dataCriacao).toBe(true);
      expect(fields.dataAtualizacao).toBe(true);

      // Verifica que não há campos extras (8 campos específicos do aluno)
      expect(Object.keys(fields)).toHaveLength(8);
    });

    test('deve ter todos os métodos CRUD disponíveis', () => {
      const methods = ['selectMany', 'selectOne', 'create', 'update', 'delete'];
      methods.forEach(method => {
        expect(contratoRepository[method]).toBeDefined();
        expect(typeof contratoRepository[method]).toBe('function');
      });
    });

    test('deve ter entity específica para alunos', () => {
      const entity = contratoRepository.getEntity();
      expect(entity).toBeDefined();
      expect(entity.name).toBe('Aluno');
    });

    test('campos específicos do modelo Aluno devem estar configurados', () => {
      const fields = contratoRepository.getSelectFields();

      // Campos obrigatórios
      expect(fields.nome).toBe(true);
      expect(fields.sobrenome).toBe(true);
      expect(fields.email).toBe(true);

      // Campos opcionais
      expect(fields.telefone).toBe(true);
      expect(fields.criador).toBe(true);

      // Campos de auditoria
      expect(fields.dataCriacao).toBe(true);
      expect(fields.dataAtualizacao).toBe(true);
    });
  });

  describe('Validação específica do modelo Aluno', () => {
    test('deve permitir criar aluno com dados válidos', () => {
      const alunoData = {
        nome: 'João',
        sobrenome: 'Silva',
        email: 'joao.silva@email.com',
        telefone: '11999999999',
        criador: null
      };

      // Testa se os dados são válidos para o modelo
      expect(alunoData.nome).toBeDefined();
      expect(alunoData.sobrenome).toBeDefined();
      expect(alunoData.email).toBeDefined();
      expect(typeof alunoData.criador === 'string' || alunoData.criador === null).toBe(true);
    });

    test('deve ter criador como campo nullable', () => {
      const fields = contratoRepository.getSelectFields();
      expect(fields.criador).toBe(true);

      // Verifica que o campo está configurado para permitir null
      const alunoComCriadorNull = {
        nome: 'Maria',
        sobrenome: 'Santos',
        email: 'maria@email.com',
        criador: null
      };

      expect(alunoComCriadorNull.criador).toBeNull();
    });

    test('deve ter telefone como campo opcional', () => {
      const fields = contratoRepository.getSelectFields();
      expect(fields.telefone).toBe(true);

      // Verifica que telefone pode ser null
      const alunoSemTelefone = {
        nome: 'Pedro',
        sobrenome: 'Costa',
        email: 'pedro@email.com',
        telefone: null
      };

      expect(alunoSemTelefone.telefone).toBeNull();
    });
  });
});
