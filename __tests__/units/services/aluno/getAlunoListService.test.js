import { GetAlunoListService } from '../../../../src/services/aluno/getAlunoListService.js';
import AlunoRepository from '../../../../src/repositories/alunoRepository.js';
import AbstractService from '../../../../src/services/abstractService.js';

describe('GetAlunoListService', () => {
  describe('Inicialização', () => {
    test('deve criar uma instância com repositório padrão', () => {
      const service = new GetAlunoListService(AlunoRepository, {});

      expect(service).toBeInstanceOf(GetAlunoListService);
      expect(service).toBeInstanceOf(AbstractService);
      expect(service.repository).toBeInstanceOf(AlunoRepository);
    });

    test('deve aceitar where clause no construtor', () => {
      const whereClause = { nome: { contains: 'João' } };
      const service = new GetAlunoListService(AlunoRepository, whereClause);

      expect(service.where).toEqual(whereClause);
    });

    test('deve herdar de AbstractService', () => {
      expect(Object.getPrototypeOf(GetAlunoListService)).toBe(AbstractService);
    });

    test('deve ter método execute implementado', () => {
      const service = new GetAlunoListService(AlunoRepository, {});

      expect(typeof service.execute).toBe('function');
      expect(service.execute).not.toBe(AbstractService.prototype.execute);
    });

    test('deve ter método handle estático implementado', () => {
      expect(typeof GetAlunoListService.handle).toBe('function');
      expect(GetAlunoListService.handle).not.toBe(AbstractService.handle);
    });
  });

  describe('Estrutura da classe', () => {
    test('deve implementar os métodos obrigatórios', () => {
      const service = new GetAlunoListService(AlunoRepository, {});

      // Verifica se tem os métodos necessários
      expect(service.execute).toBeDefined();
      expect(service.repository).toBeDefined();
      expect(service.where).toBeDefined();
      expect(GetAlunoListService.handle).toBeDefined();
    });

    test('deve ter repository configurado', () => {
      const service = new GetAlunoListService(AlunoRepository, {});

      expect(service.repository).toBeInstanceOf(AlunoRepository);
      expect(service.repository.selectMany).toBeDefined();
    });

    test('deve aceitar repository customizado no construtor', () => {
      class MockRepository {
        constructor() {
          this.selectMany = () => Promise.resolve([]);
          this.selectFields = {
            id: true,
            nome: true,
            sobrenome: true,
            email: true,
            telefone: true,
            criador: true
          };
        }
      }

      const service = new GetAlunoListService(MockRepository, {});

      expect(service.repository).toBeInstanceOf(MockRepository);
    });
  });

  describe('Integração com AbstractService', () => {
    test('deve chamar super no construtor', () => {
      const service = new GetAlunoListService(AlunoRepository, {});

      // Verifica se as propriedades da classe pai estão disponíveis
      expect(service.repository).toBeDefined();
    });

    test('deve implementar método execute abstrato', () => {
      const service = new GetAlunoListService(AlunoRepository, {});

      // O método execute deve ser diferente do da classe abstrata
      expect(service.execute).not.toBe(AbstractService.prototype.execute);
      expect(typeof service.execute).toBe('function');
    });

    test('deve ser uma subclasse de AbstractService', () => {
      const service = new GetAlunoListService(AlunoRepository, {});

      expect(service instanceof AbstractService).toBe(true);
      expect(service instanceof GetAlunoListService).toBe(true);
    });
  });

  describe('Funcionalidade do serviço', () => {
    test('deve executar busca com where clause vazio', async () => {
      class MockRepository {
        constructor() {
          this.selectFields = {
            id: true,
            nome: true,
            sobrenome: true,
            email: true,
            telefone: true,
            criador: true
          };
        }

        async selectMany({ select, where }) {
          expect(select).toEqual(this.selectFields);
          expect(where).toEqual({});
          return [
            {
              id: '1',
              nome: 'João',
              sobrenome: 'Silva',
              email: 'joao@test.com',
              telefone: '11999999999',
              criador: null
            },
            {
              id: '2',
              nome: 'Maria',
              sobrenome: 'Santos',
              email: 'maria@test.com',
              telefone: '11888888888',
              criador: 'user-123'
            }
          ];
        }
      }

      const service = new GetAlunoListService(MockRepository, {});
      const result = await service.execute();

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('nome', 'João');
      expect(result[0]).toHaveProperty('sobrenome', 'Silva');
      expect(result[0]).toHaveProperty('criador', null);
    });

    test('deve executar busca com where clause específico', async () => {
      const whereClause = { nome: { contains: 'João' } };

      class MockRepository {
        constructor() {
          this.selectFields = {
            id: true,
            nome: true,
            sobrenome: true,
            email: true,
            telefone: true,
            criador: true
          };
        }

        async selectMany({ select, where }) {
          expect(select).toEqual(this.selectFields);
          expect(where).toEqual(whereClause);
          return [
            {
              id: '1',
              nome: 'João',
              sobrenome: 'Silva',
              email: 'joao@test.com',
              telefone: null,
              criador: null
            }
          ];
        }
      }

      const service = new GetAlunoListService(MockRepository, whereClause);
      const result = await service.execute();

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('nome', 'João');
      expect(result[0]).toHaveProperty('telefone', null);
    });

    test('deve usar selectFields do repository', async () => {
      const customSelectFields = {
        id: true,
        nome: true,
        sobrenome: true,
        email: true,
        criador: true
      };

      class MockRepository {
        constructor() {
          this.selectFields = customSelectFields;
        }

        async selectMany({ select, _where }) {
          expect(select).toEqual(customSelectFields);
          return [];
        }
      }

      const service = new GetAlunoListService(MockRepository, {});
      await service.execute();
      // O teste passa se não lançar exceção
    });

    test('deve filtrar por criador', async () => {
      const whereClause = { criador: 'user-123' };

      class MockRepository {
        constructor() {
          this.selectFields = {
            id: true,
            nome: true,
            sobrenome: true,
            email: true,
            criador: true
          };
        }

        async selectMany({ select, where }) {
          expect(select).toEqual(this.selectFields);
          expect(where).toEqual(whereClause);
          return [
            {
              id: '1',
              nome: 'Pedro',
              sobrenome: 'Costa',
              email: 'pedro@test.com',
              criador: 'user-123'
            }
          ];
        }
      }

      const service = new GetAlunoListService(MockRepository, whereClause);
      const result = await service.execute();

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('criador', 'user-123');
    });

    test('deve buscar alunos sem criador (criador null)', async () => {
      const whereClause = { criador: null };

      class MockRepository {
        constructor() {
          this.selectFields = {
            id: true,
            nome: true,
            sobrenome: true,
            email: true,
            criador: true
          };
        }

        async selectMany({ select, where }) {
          expect(select).toEqual(this.selectFields);
          expect(where).toEqual(whereClause);
          return [
            {
              id: '2',
              nome: 'Ana',
              sobrenome: 'Oliveira',
              email: 'ana@test.com',
              criador: null
            }
          ];
        }
      }

      const service = new GetAlunoListService(MockRepository, whereClause);
      const result = await service.execute();

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('criador', null);
    });
  });

  describe('Método estático handle', () => {
    test('deve executar com where clause vazio', async () => {
      const result = await GetAlunoListService.handle({});

      expect(Array.isArray(result)).toBe(true);
      // Verifica se retorna array (pode estar vazio ou com dados)
      if (result.length > 0) {
        expect(result[0]).toHaveProperty('id');
        expect(result[0]).toHaveProperty('nome');
        expect(result[0]).toHaveProperty('sobrenome');
        expect(result[0]).toHaveProperty('email');
      }
    });

    test('deve executar com where clause específico', async () => {
      // Usa uma busca que provavelmente não retornará resultados
      const whereClause = { nome: { contains: 'TestAlunoNaoExistente' } };

      const result = await GetAlunoListService.handle(whereClause);

      expect(Array.isArray(result)).toBe(true);
      // Esperamos que não encontre alunos com esse nome específico
      expect(result).toHaveLength(0);
    });

    test('deve usar repositório padrão AlunoRepository', async () => {
      const result = await GetAlunoListService.handle();

      expect(Array.isArray(result)).toBe(true);
      // Verifica que o método funciona sem parâmetros
      if (result.length > 0) {
        // Verifica estrutura básica do aluno retornado
        expect(result[0]).toHaveProperty('id');
        expect(result[0]).toHaveProperty('nome');
        expect(result[0]).toHaveProperty('sobrenome');
        expect(result[0]).toHaveProperty('email');
        expect(result[0]).toHaveProperty('telefone');
        expect(result[0]).toHaveProperty('criador');
      }
    });

    test('deve executar com filtro por email', async () => {
      // Usa uma busca que provavelmente não retornará resultados
      const whereClause = { email: { contains: 'test@naoexiste.com' } };

      const result = await GetAlunoListService.handle(whereClause);

      expect(Array.isArray(result)).toBe(true);
      // Esperamos que não encontre alunos com esse email específico
      expect(result).toHaveLength(0);
    });
  });

  describe('Casos de erro', () => {
    test('deve propagar erros do repository', async () => {
      class ErrorRepository {
        constructor() {
          this.selectFields = {};
        }

        async selectMany() {
          throw new Error('Database error');
        }
      }

      const service = new GetAlunoListService(ErrorRepository, {});

      await expect(service.execute()).rejects.toThrow('Database error');
    });

    test('deve tratar erro de conexão com banco', async () => {
      class ConnectionErrorRepository {
        constructor() {
          this.selectFields = {};
        }

        async selectMany() {
          throw new Error('Connection timeout');
        }
      }

      const service = new GetAlunoListService(ConnectionErrorRepository, {});

      await expect(service.execute()).rejects.toThrow('Connection timeout');
    });
  });

  describe('Validação de parâmetros', () => {
    test('deve funcionar com where undefined', () => {
      const service = new GetAlunoListService(AlunoRepository);

      expect(service.where).toBeUndefined();
      expect(service.repository).toBeInstanceOf(AlunoRepository);
    });

    test('deve funcionar com Repository undefined no construtor', () => {
      expect(() => {
        const service = new GetAlunoListService(undefined, {});
        return service;
      }).toThrow('Repository é obrigatório');
    });

    test('deve aceitar where clause complexo', () => {
      const complexWhere = {
        AND: [
          { nome: { contains: 'João' } },
          { email: { endsWith: '@test.com' } },
          { criador: { not: null } }
        ]
      };

      const service = new GetAlunoListService(AlunoRepository, complexWhere);

      expect(service.where).toEqual(complexWhere);
    });

    test('deve aceitar where clause para campos específicos do aluno', () => {
      const alunoSpecificWhere = {
        telefone: { not: null },
        criador: 'user-123',
        email: { contains: '@escola.com' }
      };

      const service = new GetAlunoListService(AlunoRepository, alunoSpecificWhere);

      expect(service.where).toEqual(alunoSpecificWhere);
    });
  });

  describe('Cenários específicos do modelo Aluno', () => {
    test('deve buscar alunos com telefone preenchido', async () => {
      const whereClause = { telefone: { not: null } };

      class MockRepository {
        constructor() {
          this.selectFields = {
            id: true,
            nome: true,
            sobrenome: true,
            telefone: true
          };
        }

        async selectMany({ where }) {
          expect(where).toEqual(whereClause);
          return [
            {
              id: '1',
              nome: 'Carlos',
              sobrenome: 'Lima',
              telefone: '11777777777'
            }
          ];
        }
      }

      const service = new GetAlunoListService(MockRepository, whereClause);
      const result = await service.execute();

      expect(result).toHaveLength(1);
      expect(result[0].telefone).not.toBeNull();
    });

    test('deve buscar alunos por sobrenome', async () => {
      const whereClause = { sobrenome: { contains: 'Silva' } };

      class MockRepository {
        constructor() {
          this.selectFields = {
            id: true,
            nome: true,
            sobrenome: true,
            email: true
          };
        }

        async selectMany({ where }) {
          expect(where).toEqual(whereClause);
          return [
            {
              id: '1',
              nome: 'João',
              sobrenome: 'Silva',
              email: 'joao.silva@test.com'
            },
            {
              id: '2',
              nome: 'Maria',
              sobrenome: 'Silva',
              email: 'maria.silva@test.com'
            }
          ];
        }
      }

      const service = new GetAlunoListService(MockRepository, whereClause);
      const result = await service.execute();

      expect(result).toHaveLength(2);
      expect(result.every(aluno => aluno.sobrenome.includes('Silva'))).toBe(true);
    });
  });
});
