import { DeleteUserController } from '../../../../src/controllers/user/deleteUserController.js';
import { GetUserService } from '../../../../src/services/user/getUserService.js';
import { DeleteUserService } from '../../../../src/services/user/deleteUserService.js';
import AbstractController from '../../../../src/controllers/abstractController.js';

describe('DeleteUserController', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      validatedId: 'cq7k8j2l4m0n5o6p7q8r9s0t1u',
      params: { id: 'cq7k8j2l4m0n5o6p7q8r9s0t1u' },
      t: key => {
        const translations = {
          'users.get.not_found': 'Usuário não encontrado',
          'users.delete.error': 'Erro ao deletar usuário'
        };
        return translations[key] || key;
      }
    };

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
      const controller = new DeleteUserController(mockReq, mockRes);

      expect(controller).toBeInstanceOf(DeleteUserController);
      expect(controller.req).toBe(mockReq);
      expect(controller.res).toBe(mockRes);
    });

    test('deve herdar de AbstractController', () => {
      const controller = new DeleteUserController(mockReq, mockRes);
      expect(controller).toBeInstanceOf(AbstractController);
    });

    test('deve ter método execute implementado', () => {
      const controller = new DeleteUserController(mockReq, mockRes);
      expect(typeof controller.execute).toBe('function');
    });
  });

  describe('Execução com sucesso', () => {
    test('deve deletar usuário e retornar status 204', async () => {
      const originalGetHandle = GetUserService.handle;
      const originalDeleteHandle = DeleteUserService.handle;

      GetUserService.handle = async () => ({
        id: 'cq7k8j2l4m0n5o6p7q8r9s0t1u',
        email: 'test@example.com'
      });

      DeleteUserService.handle = async () => {};

      const controller = new DeleteUserController(mockReq, mockRes);
      await controller.execute();

      expect(mockRes.statusCode).toBe(204);
      expect(mockRes.data).toBeUndefined();

      GetUserService.handle = originalGetHandle;
      DeleteUserService.handle = originalDeleteHandle;
    });
  });

  describe('Usuário não encontrado', () => {
    test('deve retornar status 404 quando usuário não existe', async () => {
      const originalHandle = GetUserService.handle;
      GetUserService.handle = async () => null;

      const controller = new DeleteUserController(mockReq, mockRes);
      await controller.execute();

      expect(mockRes.statusCode).toBe(404);
      expect(mockRes.data).toEqual({
        message: 'Usuário não encontrado'
      });

      GetUserService.handle = originalHandle;
    });
  });

  describe('Tratamento de erros', () => {
    test('deve tratar erro do GetUserService', async () => {
      const testError = new Error('Database error');
      const originalHandle = GetUserService.handle;

      GetUserService.handle = async () => {
        throw testError;
      };

      const controller = new DeleteUserController(mockReq, mockRes);

      let handledError;
      let handledTranslationKey;

      controller.handleError = (error, translationKey) => {
        handledError = error;
        handledTranslationKey = translationKey;
      };

      await controller.execute();

      expect(handledError).toBe(testError);
      expect(handledTranslationKey).toBe('users.delete.error');

      GetUserService.handle = originalHandle;
    });
  });

  describe('Método estático handle', () => {
    test('deve executar através do método estático', async () => {
      const originalGetHandle = GetUserService.handle;
      const originalDeleteHandle = DeleteUserService.handle;

      GetUserService.handle = async () => ({
        id: 'cq7k8j2l4m0n5o6p7q8r9s0t1u',
        email: 'test@example.com'
      });

      DeleteUserService.handle = async () => {};

      await DeleteUserController.handle(mockReq, mockRes);

      expect(mockRes.statusCode).toBe(204);

      GetUserService.handle = originalGetHandle;
      DeleteUserService.handle = originalDeleteHandle;
    });
  });
});
