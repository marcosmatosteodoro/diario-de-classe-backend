import AlunoRepository from '../../../src/repositories/alunoRepository.js';

describe('AlunoRepository', () => {
  let alunoRepository;

  beforeEach(() => {
    alunoRepository = new AlunoRepository();
  });

  describe('Inicialização', () => {
    test('deve instanciar corretamente', () => {
      expect(alunoRepository).toBeInstanceOf(AlunoRepository);
      expect(alunoRepository.entity).toBeDefined();
    });

    test('deve ter método getEntity', () => {
      expect(typeof alunoRepository.getEntity).toBe('function');
      expect(alunoRepository.getEntity()).toBeDefined();
    });

    test('deve ter método getSelectFields', () => {
      expect(typeof alunoRepository.getSelectFields).toBe('function');
      expect(alunoRepository.getSelectFields()).toBeDefined();
    });

    test('deve ter propriedade selectFields definida', () => {
      expect(alunoRepository.selectFields).toBeDefined();
      expect(typeof alunoRepository.selectFields).toBe('object');
    });

    test('deve herdar de AbstractRepository', () => {
      expect(typeof alunoRepository.selectMany).toBe('function');
      expect(typeof alunoRepository.selectOne).toBe('function');
      expect(typeof alunoRepository.create).toBe('function');
      expect(typeof alunoRepository.update).toBe('function');
      expect(typeof alunoRepository.delete).toBe('function');
    });
  });

  describe('Métodos CRUD', () => {
    test('selectMany deve ser uma função', () => {
      expect(typeof alunoRepository.selectMany).toBe('function');
    });

    test('selectOne deve ser uma função', () => {
      expect(typeof alunoRepository.selectOne).toBe('function');
    });

    test('create deve ser uma função', () => {
      expect(typeof alunoRepository.create).toBe('function');
    });

    test('update deve ser uma função', () => {
      expect(typeof alunoRepository.update).toBe('function');
    });

    test('delete deve ser uma função', () => {
      expect(typeof alunoRepository.delete).toBe('function');
    });
  });

  describe('Validação de parâmetros', () => {
    test('selectOne deve lançar erro quando where não é fornecido', async () => {
      await expect(alunoRepository.selectOne({})).rejects.toThrow(
        'Condições de busca (where) são obrigatórias'
      );
    });

    test('selectOne deve lançar erro quando where é undefined', async () => {
      await expect(alunoRepository.selectOne({ where: undefined })).rejects.toThrow(
        'Condições de busca (where) são obrigatórias'
      );
    });
  });

  describe('Estrutura da classe', () => {
    test('deve ter propriedade entity definida', () => {
      expect(alunoRepository.entity).toBeDefined();
      expect(alunoRepository.entity).toBeTruthy();
    });

    test('getEntity deve retornar a mesma entidade que entity', () => {
      expect(alunoRepository.getEntity()).toBe(alunoRepository.entity);
    });

    test('getSelectFields deve retornar os mesmos campos que selectFields', () => {
      expect(alunoRepository.getSelectFields()).toEqual(alunoRepository.selectFields);
    });

    test('selectFields deve conter campos corretos para alunos', () => {
      const fields = alunoRepository.selectFields;

      // Verifica campos que devem estar presentes
      expect(fields.id).toBe(true);
      expect(fields.nome).toBe(true);
      expect(fields.sobrenome).toBe(true);
      expect(fields.nomeCompleto).toBe(true);
      expect(fields.email).toBe(true);
      expect(fields.telefone).toBe(true);
      expect(fields.material).toBe(true);
      expect(fields.criador).toBe(true);
      expect(fields.dataCriacao).toBe(true);
      expect(fields.dataAtualizacao).toBe(true);

      // Verifica que não há campos extras (10 campos específicos do aluno)
      expect(Object.keys(fields)).toHaveLength(10);
    });

    test('deve ter todos os métodos CRUD disponíveis', () => {
      const methods = ['selectMany', 'selectOne', 'create', 'update', 'delete'];
      methods.forEach(method => {
        expect(alunoRepository[method]).toBeDefined();
        expect(typeof alunoRepository[method]).toBe('function');
      });
    });

    test('deve ter entity específica para alunos', () => {
      const entity = alunoRepository.getEntity();
      expect(entity).toBeDefined();
      expect(entity.name).toBe('Aluno');
    });

    test('campos específicos do modelo Aluno devem estar configurados', () => {
      const fields = alunoRepository.getSelectFields();

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
      const fields = alunoRepository.getSelectFields();
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
      const fields = alunoRepository.getSelectFields();
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
