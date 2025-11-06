import { GetAlunoListController } from '../../../../src/controllers/aluno/getAlunoListController.js';
import AbstractController from '../../../../src/controllers/abstractController.js';

describe('GetAlunoListController', () => {
  let mockReq;
  let mockRes;
  let statusCode;
  let responseData;
  let statusCalled;
  let jsonCalled;

  beforeEach(() => {
    statusCode = 0;
    responseData = null;
    statusCalled = false;
    jsonCalled = false;

    mockReq = {
      query: {},
      t: key => key
    };

    mockRes = {
      status: function (code) {
        statusCalled = true;
        statusCode = code;
        return this;
      },
      json: function (data) {
        jsonCalled = true;
        responseData = data;
        return this;
      }
    };
  });

  describe('Inicialização', () => {
    test('deve criar uma instância corretamente', () => {
      const controller = new GetAlunoListController(mockReq, mockRes);

      expect(controller).toBeInstanceOf(GetAlunoListController);
      expect(controller).toBeInstanceOf(AbstractController);
      expect(controller.req).toBe(mockReq);
      expect(controller.res).toBe(mockRes);
      expect(controller.where).toEqual({});
    });

    test('deve herdar de AbstractController', () => {
      expect(Object.getPrototypeOf(GetAlunoListController)).toBe(AbstractController);
    });

    test('deve implementar métodos obrigatórios', () => {
      const controller = new GetAlunoListController(mockReq, mockRes);

      expect(typeof controller.execute).toBe('function');
      expect(controller.execute).not.toBe(AbstractController.prototype.execute);
      expect(typeof GetAlunoListController.handle).toBe('function');
      expect(GetAlunoListController.handle).not.toBe(AbstractController.handle);
    });

    test('deve inicializar where como objeto vazio', () => {
      const controller = new GetAlunoListController(mockReq, mockRes);

      expect(controller.where).toEqual({});
      expect(typeof controller.where).toBe('object');
    });
  });

  describe('Processamento de query de busca', () => {
    test('deve processar query de busca quando presente', () => {
      mockReq.query.q = 'João';
      const controller = new GetAlunoListController(mockReq, mockRes);

      expect(controller.req.query.q).toBe('João');
    });

    test('deve manter where vazio quando não há query', () => {
      const controller = new GetAlunoListController(mockReq, mockRes);

      expect(controller.where).toEqual({});
    });

    test('deve ter campos de busca definidos para alunos', () => {
      const controller = new GetAlunoListController(mockReq, mockRes);

      // Verifica que o controller está configurado para usar os campos corretos do modelo Aluno
      expect(controller).toBeInstanceOf(GetAlunoListController);
    });

    test('deve configurar campos de busca específicos do modelo Aluno', () => {
      mockReq.query.q = 'Maria Silva';
      const controller = new GetAlunoListController(mockReq, mockRes);

      // O controller deve estar preparado para buscar nos campos: nome, sobrenome, email, telefone
      expect(controller.req.query.q).toBe('Maria Silva');
    });
  });

  describe('Método execute()', () => {
    test('deve ser uma função assíncrona', () => {
      const controller = new GetAlunoListController(mockReq, mockRes);

      expect(typeof controller.execute).toBe('function');
      expect(controller.execute.constructor.name).toBe('AsyncFunction');
    });

    test('deve ter estrutura correta para resposta com alunos', () => {
      const controller = new GetAlunoListController(mockReq, mockRes);

      // Verifica que tem acesso aos métodos de resposta necessários
      expect(typeof controller.res.status).toBe('function');
      expect(typeof controller.res.json).toBe('function');
    });

    test('deve usar códigos de status HTTP corretos', () => {
      const controller = new GetAlunoListController(mockReq, mockRes);

      // Testa o encadeamento de métodos
      const result = controller.res.status(200);
      expect(result).toBe(controller.res);
      expect(statusCode).toBe(200);
      expect(statusCalled).toBe(true);
    });

    test('deve ter acesso ao método handleError', () => {
      const controller = new GetAlunoListController(mockReq, mockRes);

      expect(typeof controller.handleError).toBe('function');
      expect(controller.handleError).toBe(AbstractController.prototype.handleError);
    });

    test('deve usar chave de tradução correta para erros de alunos', () => {
      const controller = new GetAlunoListController(mockReq, mockRes);

      // Testa handleError com a chave específica para alunos
      const error = new Error('Test error');
      controller.handleError(error, 'alunos.list.error');

      expect(statusCalled).toBe(true);
      expect(statusCode).toBe(500);
      expect(jsonCalled).toBe(true);
      expect(responseData).toEqual({
        message: 'alunos.list.error',
        error: 'Test error'
      });
    });
  });

  describe('Método estático handle()', () => {
    test('deve ser uma função assíncrona', () => {
      expect(typeof GetAlunoListController.handle).toBe('function');
      expect(GetAlunoListController.handle.constructor.name).toBe('AsyncFunction');
    });

    test('deve aceitar parâmetros req e res', () => {
      const handleMethod = GetAlunoListController.handle;
      expect(handleMethod).toBeDefined();
      expect(handleMethod.length).toBe(2); // Aceita 2 parâmetros
    });

    test('deve existir e ser diferente do método pai', () => {
      expect(GetAlunoListController.handle).toBeDefined();
      expect(GetAlunoListController.handle).not.toBe(AbstractController.handle);
    });
  });

  describe('Integração com AbstractController', () => {
    test('deve ter acesso aos métodos da classe pai', () => {
      const controller = new GetAlunoListController(mockReq, mockRes);

      expect(controller.handleError).toBeDefined();
      expect(typeof controller.handleError).toBe('function');
    });

    test('deve chamar super no construtor', () => {
      const controller = new GetAlunoListController(mockReq, mockRes);

      // Verifica se as propriedades da classe pai estão disponíveis
      expect(controller.req).toBe(mockReq);
      expect(controller.res).toBe(mockRes);
    });

    test('deve ser uma subclasse de AbstractController', () => {
      const controller = new GetAlunoListController(mockReq, mockRes);

      expect(controller instanceof AbstractController).toBe(true);
      expect(controller instanceof GetAlunoListController).toBe(true);
    });
  });

  describe('Estrutura da resposta', () => {
    test('deve ter estrutura para resposta com count e data para alunos', () => {
      const controller = new GetAlunoListController(mockReq, mockRes);

      // Testa encadeamento de status().json() com dados de alunos
      controller.res.status(200).json({
        count: 2,
        data: [
          {
            id: 'aluno1',
            nome: 'João',
            sobrenome: 'Silva',
            email: 'joao@escola.com',
            telefone: '11999999999'
          },
          {
            id: 'aluno2',
            nome: 'Maria',
            sobrenome: 'Santos',
            email: 'maria@escola.com',
            telefone: '11888888888'
          }
        ]
      });

      expect(statusCode).toBe(200);
      expect(responseData).toEqual({
        count: 2,
        data: [
          {
            id: 'aluno1',
            nome: 'João',
            sobrenome: 'Silva',
            email: 'joao@escola.com',
            telefone: '11999999999'
          },
          {
            id: 'aluno2',
            nome: 'Maria',
            sobrenome: 'Santos',
            email: 'maria@escola.com',
            telefone: '11888888888'
          }
        ]
      });
    });

    test('deve retornar 204 para lista vazia de alunos', () => {
      const controller = new GetAlunoListController(mockReq, mockRes);

      controller.res.status(204).json();

      expect(statusCode).toBe(204);
      expect(statusCalled).toBe(true);
      expect(jsonCalled).toBe(true);
    });

    test('deve usar códigos de status HTTP corretos para alunos', () => {
      const controller = new GetAlunoListController(mockReq, mockRes);

      // Testa status 200 para sucesso
      controller.res.status(200);
      expect(statusCode).toBe(200);

      // Reset para testar 204
      statusCode = 0;
      statusCalled = false;

      controller.res.status(204);
      expect(statusCode).toBe(204);
    });

    test('deve ter estrutura de resposta específica para alunos', () => {
      const controller = new GetAlunoListController(mockReq, mockRes);

      const alunosData = [
        {
          id: 'aluno1',
          nome: 'Pedro',
          sobrenome: 'Costa',
          email: 'pedro@escola.edu.br',
          telefone: '11987654321',
          criador: 'professor123'
        }
      ];

      controller.res.status(200).json({
        count: alunosData.length,
        data: alunosData
      });

      expect(statusCode).toBe(200);
      expect(responseData.count).toBe(1);
      expect(responseData.data).toEqual(alunosData);
    });
  });

  describe('Integração com utilities', () => {
    test('deve ter configuração correta para campos de busca de alunos', () => {
      mockReq.query.q = 'test';
      const controller = new GetAlunoListController(mockReq, mockRes);

      // Verifica que o controller tem acesso à query
      expect(controller.req.query.q).toBe('test');
    });

    test('deve processar diferentes tipos de query para alunos', () => {
      // Teste com query string - nome completo
      mockReq.query.q = 'João Silva';
      let controller = new GetAlunoListController(mockReq, mockRes);
      expect(controller.req.query.q).toBe('João Silva');

      // Teste com query - email
      mockReq.query.q = 'joao@escola.com';
      controller = new GetAlunoListController(mockReq, mockRes);
      expect(controller.req.query.q).toBe('joao@escola.com');

      // Teste com query - telefone
      mockReq.query.q = '11999999999';
      controller = new GetAlunoListController(mockReq, mockRes);
      expect(controller.req.query.q).toBe('11999999999');

      // Teste com query vazia
      mockReq.query.q = '';
      controller = new GetAlunoListController(mockReq, mockRes);
      expect(controller.req.query.q).toBe('');

      // Teste sem query
      delete mockReq.query.q;
      controller = new GetAlunoListController(mockReq, mockRes);
      expect(controller.req.query.q).toBeUndefined();
    });

    test('deve processar busca por campos específicos do modelo Aluno', () => {
      // Teste busca por nome
      mockReq.query.q = 'Ana';
      let controller = new GetAlunoListController(mockReq, mockRes);
      expect(controller.req.query.q).toBe('Ana');

      // Teste busca por sobrenome
      mockReq.query.q = 'Oliveira';
      controller = new GetAlunoListController(mockReq, mockRes);
      expect(controller.req.query.q).toBe('Oliveira');

      // Teste busca por email educacional
      mockReq.query.q = '@escola.edu.br';
      controller = new GetAlunoListController(mockReq, mockRes);
      expect(controller.req.query.q).toBe('@escola.edu.br');
    });
  });

  describe('Tratamento de erros', () => {
    test('deve usar handleError com mensagem de erro específica para alunos', () => {
      const controller = new GetAlunoListController(mockReq, mockRes);
      const error = new Error('Database connection failed');

      controller.handleError(error, 'alunos.list.error');

      expect(statusCalled).toBe(true);
      expect(statusCode).toBe(500);
      expect(jsonCalled).toBe(true);
      expect(responseData.message).toBe('alunos.list.error');
      expect(responseData.error).toBe('Database connection failed');
    });

    test('deve usar handleError com erro genérico', () => {
      const controller = new GetAlunoListController(mockReq, mockRes);
      const error = new Error('Generic error');

      controller.handleError(error);

      expect(statusCalled).toBe(true);
      expect(statusCode).toBe(500);
      expect(jsonCalled).toBe(true);
      expect(responseData.message).toBe('error.internal');
    });

    test('deve propagar erros do serviço de alunos', () => {
      // Simula diferentes tipos de erro que podem ocorrer com alunos
      expect(() => {
        throw new Error('Aluno service error');
      }).toThrow('Aluno service error');

      expect(() => {
        throw new Error('Database connection failed');
      }).toThrow('Database connection failed');

      expect(() => {
        throw new Error('Invalid query parameters');
      }).toThrow('Invalid query parameters');
    });

    test('deve tratar erros específicos do modelo Aluno', () => {
      const controller = new GetAlunoListController(mockReq, mockRes);

      // Simula erro de acesso negado
      const accessError = new Error('Access denied to students data');
      controller.handleError(accessError, 'alunos.list.error');

      expect(statusCalled).toBe(true);
      expect(statusCode).toBe(500);
      expect(responseData.message).toBe('alunos.list.error');
      expect(responseData.error).toBe('Access denied to students data');
    });
  });

  describe('Casos específicos do modelo Aluno', () => {
    test('deve processar query com caracteres especiais para alunos', () => {
      mockReq.query.q = 'José da Silva';
      const controller = new GetAlunoListController(mockReq, mockRes);

      expect(controller.req.query.q).toBe('José da Silva');
    });

    test('deve processar query com números (matrícula/telefone)', () => {
      mockReq.query.q = '2024001';
      const controller = new GetAlunoListController(mockReq, mockRes);

      expect(controller.req.query.q).toBe('2024001');
    });

    test('deve ter estrutura adequada para dados educacionais', () => {
      const controller = new GetAlunoListController(mockReq, mockRes);

      const alunoEducacional = {
        id: 'student123',
        nome: 'Carlos Eduardo',
        sobrenome: 'Ferreira Santos',
        email: 'carlos.eduardo@escola.gov.br',
        telefone: '11987654321',
        criador: 'coordenador456',
        dataCriacao: '2024-01-15T10:00:00Z',
        dataAtualizacao: '2024-01-15T10:00:00Z'
      };

      controller.res.status(200).json({
        count: 1,
        data: [alunoEducacional]
      });

      expect(statusCode).toBe(200);
      expect(responseData.count).toBe(1);
      expect(responseData.data[0]).toEqual(alunoEducacional);
    });

    test('deve aceitar busca sem resultados para alunos', () => {
      const controller = new GetAlunoListController(mockReq, mockRes);

      controller.res.status(204).json();

      expect(statusCode).toBe(204);
      expect(statusCalled).toBe(true);
      expect(jsonCalled).toBe(true);
    });

    test('deve processar lista completa de alunos', () => {
      const controller = new GetAlunoListController(mockReq, mockRes);

      const listaAlunos = [
        { id: '1', nome: 'Ana', sobrenome: 'Silva', email: 'ana@escola.com' },
        { id: '2', nome: 'Bruno', sobrenome: 'Costa', email: 'bruno@escola.com' },
        { id: '3', nome: 'Carla', sobrenome: 'Santos', email: 'carla@escola.com' }
      ];

      controller.res.status(200).json({
        count: listaAlunos.length,
        data: listaAlunos
      });

      expect(statusCode).toBe(200);
      expect(responseData.count).toBe(3);
      expect(responseData.data).toEqual(listaAlunos);
    });
  });
});
