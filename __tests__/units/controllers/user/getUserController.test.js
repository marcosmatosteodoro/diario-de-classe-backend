import { GetUserController } from '../../../../src/controllers/user/getUserController.js';
import { GetUserService } from '../../../../src/services/user/getUserService.js';
import AbstractController from '../../../../src/controllers/abstractController.js';

describe('GetUserController', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    // Mock básico do request
    mockReq = {
      params: { id: '1' },
      t: key => {
        const translations = {
          'users.get.not_found': 'Usuário não encontrado',
          'users.get.error': 'Erro ao buscar usuário'
        };
        return translations[key] || key;
      }
    };

    // Mock básico do response
    mockRes = {
      status: function (code) {
        this.statusCode = code;
        return this;
      },
      json: function (data) {
        this.data = data;
        return this;
      },
      statusCode: null,
      data: null
    };
  });

  describe('Inicialização', () => {
    test('deve criar uma instância com req e res', () => {
      const controller = new GetUserController(mockReq, mockRes);

      expect(controller).toBeInstanceOf(GetUserController);
      expect(controller.req).toBe(mockReq);
      expect(controller.res).toBe(mockRes);
    });

    test('deve herdar de AbstractController', () => {
      const controller = new GetUserController(mockReq, mockRes);

      expect(controller).toBeInstanceOf(AbstractController);
    });

    test('deve ter método execute implementado', () => {
      const controller = new GetUserController(mockReq, mockRes);

      expect(controller.execute).toBeDefined();
      expect(typeof controller.execute).toBe('function');
    });

    test('deve ter método estático handle', () => {
      expect(GetUserController.handle).toBeDefined();
      expect(typeof GetUserController.handle).toBe('function');
    });
  });

  describe('Estrutura da classe', () => {
    test('deve implementar os métodos obrigatórios', () => {
      const controller = new GetUserController(mockReq, mockRes);

      expect(typeof controller.execute).toBe('function');
      expect(typeof GetUserController.handle).toBe('function');
    });

    test('deve armazenar req e res corretamente', () => {
      const controller = new GetUserController(mockReq, mockRes);

      expect(controller.req).toBe(mockReq);
      expect(controller.res).toBe(mockRes);
    });

    test('deve chamar super no construtor', () => {
      const controller = new GetUserController(mockReq, mockRes);

      // Verifica se inherited properties estão disponíveis
      expect(controller.handleError).toBeDefined();
    });
  });

  describe('Método execute()', () => {
    test('deve existir e ser uma função assíncrona', () => {
      const controller = new GetUserController(mockReq, mockRes);

      expect(typeof controller.execute).toBe('function');
      expect(controller.execute.constructor.name).toBe('AsyncFunction');
    });

    test('deve extrair ID dos parâmetros da requisição', async () => {
      // Mock do GetUserService.handle para retornar null
      const originalHandle = GetUserService.handle;
      GetUserService.handle = async id => {
        expect(id).toBe('1');
        return null;
      };

      const controller = new GetUserController(mockReq, mockRes);
      await controller.execute();

      // Restore original
      GetUserService.handle = originalHandle;
    });

    test('deve retornar 404 quando usuário não for encontrado', async () => {
      // Mock do GetUserService.handle para retornar null
      const originalHandle = GetUserService.handle;
      GetUserService.handle = async () => null;

      const controller = new GetUserController(mockReq, mockRes);
      await controller.execute();

      expect(mockRes.statusCode).toBe(404);
      expect(mockRes.data).toEqual({
        message: 'Usuário não encontrado'
      });

      // Restore original
      GetUserService.handle = originalHandle;
    });

    test('deve usar chave de tradução correta para not_found', async () => {
      let translationKey = '';
      mockReq.t = key => {
        translationKey = key;
        return 'Usuário não encontrado';
      };

      // Mock do GetUserService.handle para retornar null
      const originalHandle = GetUserService.handle;
      GetUserService.handle = async () => null;

      const controller = new GetUserController(mockReq, mockRes);
      await controller.execute();

      expect(translationKey).toBe('users.get.not_found');

      // Restore original
      GetUserService.handle = originalHandle;
    });

    test('deve funcionar com ID undefined', async () => {
      mockReq.params.id = undefined;

      // Mock do GetUserService.handle
      const originalHandle = GetUserService.handle;
      GetUserService.handle = async id => {
        expect(id).toBe(undefined);
        return null;
      };

      const controller = new GetUserController(mockReq, mockRes);
      await controller.execute();

      expect(mockRes.statusCode).toBe(404);

      // Restore original
      GetUserService.handle = originalHandle;
    });
  });

  describe('Método estático handle()', () => {
    test('deve ser uma função estática', () => {
      expect(typeof GetUserController.handle).toBe('function');
      expect(GetUserController.handle).not.toBe(AbstractController.handle);
    });

    test('deve criar nova instância do controller a cada chamada', async () => {
      // Mock simples
      const originalHandle = GetUserService.handle;
      GetUserService.handle = async () => ({ id: 1 });

      await GetUserController.handle(mockReq, mockRes);
      expect(mockRes.statusCode).toBe(200);

      // Restore original
      GetUserService.handle = originalHandle;
    });
  });

  describe('Integração com AbstractController', () => {
    test('deve implementar método execute() abstrato', () => {
      const controller = new GetUserController(mockReq, mockRes);

      expect(controller.execute).toBeDefined();
      expect(controller.execute).not.toBe(AbstractController.prototype.execute);
    });

    test('deve ter acesso ao método handleError da classe pai', () => {
      const controller = new GetUserController(mockReq, mockRes);

      expect(controller.handleError).toBeDefined();
      expect(typeof controller.handleError).toBe('function');
    });

    test('deve ser uma subclasse de AbstractController', () => {
      expect(GetUserController.prototype).toBeInstanceOf(Object);
      expect(Object.getPrototypeOf(GetUserController.prototype)).toBe(AbstractController.prototype);
    });

    test('deve implementar método handle() estático', () => {
      expect(typeof GetUserController.handle).toBe('function');
      expect(GetUserController.handle).not.toBe(AbstractController.handle);
    });
  });

  describe('Cenários de sucesso', () => {
    test('deve retornar usuário com status 200', async () => {
      const mockUser = {
        id: 1,
        nome: 'João',
        email: 'joao@email.com'
      };

      // Mock do GetUserService.handle
      const originalHandle = GetUserService.handle;
      GetUserService.handle = async () => mockUser;

      const controller = new GetUserController(mockReq, mockRes);
      await controller.execute();

      expect(mockRes.statusCode).toBe(200);
      expect(mockRes.data).toEqual(mockUser);

      // Restore original
      GetUserService.handle = originalHandle;
    });

    test('deve retornar objeto completo do usuário', async () => {
      const mockUser = {
        id: 1,
        nome: 'João Silva',
        sobrenome: 'Santos',
        email: 'joao@email.com',
        telefone: '11999999999',
        resetarSenha: false,
        permissao: 'user',
        dataCriacao: '2024-01-01',
        dataAtualizacao: '2024-01-02'
      };

      // Mock do GetUserService.handle
      const originalHandle = GetUserService.handle;
      GetUserService.handle = async () => mockUser;

      const controller = new GetUserController(mockReq, mockRes);
      await controller.execute();

      expect(mockRes.statusCode).toBe(200);
      expect(mockRes.data).toEqual(mockUser);

      // Restore original
      GetUserService.handle = originalHandle;
    });
  });

  describe('Tratamento de erros', () => {
    test('deve chamar handleError quando ocorrer exceção', async () => {
      const mockError = new Error('Erro de conexão');

      // Mock do GetUserService.handle para lançar erro
      const originalHandle = GetUserService.handle;
      GetUserService.handle = async () => {
        throw mockError;
      };

      const controller = new GetUserController(mockReq, mockRes);

      // Mock do handleError para verificar se foi chamado
      let handleErrorCalled = false;
      let errorReceived = null;
      let keyReceived = null;

      controller.handleError = (error, key) => {
        handleErrorCalled = true;
        errorReceived = error;
        keyReceived = key;
      };

      await controller.execute();

      expect(handleErrorCalled).toBe(true);
      expect(errorReceived).toBe(mockError);
      expect(keyReceived).toBe('users.get.error');

      // Restore original
      GetUserService.handle = originalHandle;
    });

    test('deve usar chave de tradução correta para erro', async () => {
      const mockError = new Error('Service error');

      // Mock do GetUserService.handle para lançar erro
      const originalHandle = GetUserService.handle;
      GetUserService.handle = async () => {
        throw mockError;
      };

      const controller = new GetUserController(mockReq, mockRes);

      let translationKey = '';
      controller.handleError = (error, key) => {
        translationKey = key;
      };

      await controller.execute();

      expect(translationKey).toBe('users.get.error');

      // Restore original
      GetUserService.handle = originalHandle;
    });
  });

  describe('Validação de parâmetros', () => {
    test('deve funcionar com diferentes IDs', async () => {
      const testCases = ['1', '123', 'abc', null, undefined];

      // Mock do GetUserService.handle
      const originalHandle = GetUserService.handle;
      const receivedIds = [];

      GetUserService.handle = async id => {
        receivedIds.push(id);
        return null;
      };

      for (const testId of testCases) {
        mockReq.params.id = testId;
        const controller = new GetUserController(mockReq, mockRes);
        await controller.execute();
      }

      expect(receivedIds).toEqual(testCases);

      // Restore original
      GetUserService.handle = originalHandle;
    });
  });
});
