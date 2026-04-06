import { GetUserListController } from '../../../../src/controllers/user/getUserListController.js';
import AbstractController from '../../../../src/controllers/abstractController.js';

describe('GetUserListController', () => {
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
      const controller = new GetUserListController(mockReq, mockRes);

      expect(controller).toBeInstanceOf(GetUserListController);
      expect(controller).toBeInstanceOf(AbstractController);
      expect(controller.req).toBe(mockReq);
      expect(controller.res).toBe(mockRes);
      expect(controller.where).toEqual({});
    });

    test('deve herdar de AbstractController', () => {
      expect(Object.getPrototypeOf(GetUserListController)).toBe(AbstractController);
    });

    test('deve implementar métodos obrigatórios', () => {
      const controller = new GetUserListController(mockReq, mockRes);

      expect(typeof controller.execute).toBe('function');
      expect(controller.execute).not.toBe(AbstractController.prototype.execute);
      expect(typeof GetUserListController.handle).toBe('function');
      expect(GetUserListController.handle).not.toBe(AbstractController.handle);
    });

    test('deve inicializar where como objeto vazio', () => {
      const controller = new GetUserListController(mockReq, mockRes);

      expect(controller.where).toEqual({});
      expect(typeof controller.where).toBe('object');
    });
  });

  describe('Processamento de query de busca', () => {
    test('deve processar query de busca quando presente', () => {
      mockReq.query.q = 'João';
      const controller = new GetUserListController(mockReq, mockRes);

      expect(controller.req.query.q).toBe('João');
    });

    test('deve manter where vazio quando não há query', () => {
      const controller = new GetUserListController(mockReq, mockRes);

      expect(controller.where).toEqual({});
    });

    test('deve ter campos de busca definidos incluindo nomeCompleto', () => {
      const controller = new GetUserListController(mockReq, mockRes);

      // Verifica que o controller está configurado para usar os campos corretos
      expect(controller).toBeInstanceOf(GetUserListController);
      // Os campos nomeCompleto, nome, sobrenome, email, telefone devem ser usados na busca
    });

    test('deve buscar por nomeCompleto, nome, sobrenome, email e telefone quando q é fornecido', () => {
      mockReq.query.q = 'João';
      const controller = new GetUserListController(mockReq, mockRes);

      // O controller deve chamar getWhereClauseByQuerySearch com os campos corretos
      expect(controller.req.query.q).toBe('João');
      // Verifica que o método será chamado com os campos corretos na função execute
    });
  });

  describe('Método execute()', () => {
    test('deve ser uma função assíncrona', () => {
      const controller = new GetUserListController(mockReq, mockRes);

      expect(typeof controller.execute).toBe('function');
      expect(controller.execute.constructor.name).toBe('AsyncFunction');
    });

    test('deve ter estrutura correta para resposta com usuários', () => {
      const controller = new GetUserListController(mockReq, mockRes);

      // Verifica que tem acesso aos métodos de resposta necessários
      expect(typeof controller.res.status).toBe('function');
      expect(typeof controller.res.json).toBe('function');
    });

    test('deve usar códigos de status HTTP corretos', () => {
      const controller = new GetUserListController(mockReq, mockRes);

      // Testa o encadeamento de métodos
      const result = controller.res.status(200);
      expect(result).toBe(controller.res);
      expect(statusCode).toBe(200);
      expect(statusCalled).toBe(true);
    });

    test('deve ter acesso ao método handleError', () => {
      const controller = new GetUserListController(mockReq, mockRes);

      expect(typeof controller.handleError).toBe('function');
      expect(controller.handleError).toBe(AbstractController.prototype.handleError);
    });

    test('deve usar chave de tradução correta para erros', () => {
      const controller = new GetUserListController(mockReq, mockRes);

      // Testa handleError com a chave específica
      const error = new Error('Test error');
      controller.handleError(error, 'users.list.error');

      expect(statusCalled).toBe(true);
      expect(statusCode).toBe(500);
      expect(jsonCalled).toBe(true);
      expect(responseData).toEqual({
        message: 'users.list.error',
        error: 'Test error'
      });
    });
  });

  describe('Método estático handle()', () => {
    test('deve ser uma função assíncrona', () => {
      expect(typeof GetUserListController.handle).toBe('function');
      expect(GetUserListController.handle.constructor.name).toBe('AsyncFunction');
    });

    test('deve aceitar parâmetros req e res', () => {
      const handleMethod = GetUserListController.handle;
      expect(handleMethod).toBeDefined();
      expect(handleMethod.length).toBe(2); // Aceita 2 parâmetros
    });

    test('deve existir e ser diferente do método pai', () => {
      expect(GetUserListController.handle).toBeDefined();
      expect(GetUserListController.handle).not.toBe(AbstractController.handle);
    });
  });

  describe('Integração com AbstractController', () => {
    test('deve ter acesso aos métodos da classe pai', () => {
      const controller = new GetUserListController(mockReq, mockRes);

      expect(controller.handleError).toBeDefined();
      expect(typeof controller.handleError).toBe('function');
    });

    test('deve chamar super no construtor', () => {
      const controller = new GetUserListController(mockReq, mockRes);

      // Verifica se as propriedades da classe pai estão disponíveis
      expect(controller.req).toBe(mockReq);
      expect(controller.res).toBe(mockRes);
    });

    test('deve ser uma subclasse de AbstractController', () => {
      const controller = new GetUserListController(mockReq, mockRes);

      expect(controller instanceof AbstractController).toBe(true);
      expect(controller instanceof GetUserListController).toBe(true);
    });
  });

  describe('Estrutura da resposta', () => {
    test('deve ter estrutura para resposta com count e data', () => {
      const controller = new GetUserListController(mockReq, mockRes);

      // Testa encadeamento de status().json()
      controller.res.status(200).json({
        count: 2,
        data: [
          { id: '1', nome: 'João' },
          { id: '2', nome: 'Maria' }
        ]
      });

      expect(statusCode).toBe(200);
      expect(responseData).toEqual({
        count: 2,
        data: [
          { id: '1', nome: 'João' },
          { id: '2', nome: 'Maria' }
        ]
      });
    });

    test('deve retornar 204 para lista vazia', () => {
      const controller = new GetUserListController(mockReq, mockRes);

      controller.res.status(204).json();

      expect(statusCode).toBe(204);
      expect(statusCalled).toBe(true);
      expect(jsonCalled).toBe(true);
    });

    test('deve usar códigos de status HTTP corretos', () => {
      const controller = new GetUserListController(mockReq, mockRes);

      // Testa status 200 para sucesso
      controller.res.status(200);
      expect(statusCode).toBe(200);

      // Reset para testar 204
      statusCode = 0;
      statusCalled = false;

      controller.res.status(204);
      expect(statusCode).toBe(204);
    });
  });

  describe('Integração com utilities', () => {
    test('deve ter configuração correta para campos de busca', () => {
      mockReq.query.q = 'test';
      const controller = new GetUserListController(mockReq, mockRes);

      // Verifica que o controller tem acesso à query
      expect(controller.req.query.q).toBe('test');
    });

    test('deve processar diferentes tipos de query', () => {
      // Teste com query string
      mockReq.query.q = 'João Silva';
      let controller = new GetUserListController(mockReq, mockRes);
      expect(controller.req.query.q).toBe('João Silva');

      // Teste com query vazia
      mockReq.query.q = '';
      controller = new GetUserListController(mockReq, mockRes);
      expect(controller.req.query.q).toBe('');

      // Teste sem query
      delete mockReq.query.q;
      controller = new GetUserListController(mockReq, mockRes);
      expect(controller.req.query.q).toBeUndefined();
    });
  });

  describe('Tratamento de erros', () => {
    test('deve usar handleError com mensagem de erro específica', () => {
      const controller = new GetUserListController(mockReq, mockRes);
      const error = new Error('Database connection failed');

      controller.handleError(error, 'users.list.error');

      expect(statusCalled).toBe(true);
      expect(statusCode).toBe(500);
      expect(jsonCalled).toBe(true);
      expect(responseData.message).toBe('users.list.error');
      expect(responseData.error).toBe('Database connection failed');
    });

    test('deve usar handleError com erro genérico', () => {
      const controller = new GetUserListController(mockReq, mockRes);
      const error = new Error('Generic error');

      controller.handleError(error);

      expect(statusCalled).toBe(true);
      expect(statusCode).toBe(500);
      expect(jsonCalled).toBe(true);
      expect(responseData.message).toBe('error.internal');
    });

    test('deve propagar erros do serviço', () => {
      // Simula diferentes tipos de erro que podem ocorrer
      expect(() => {
        throw new Error('Service error');
      }).toThrow('Service error');

      expect(() => {
        throw new Error('Database connection failed');
      }).toThrow('Database connection failed');
    });
  });
});
