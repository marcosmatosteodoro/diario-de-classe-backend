import { GetAulasByContratoController } from '../../../../src/controllers/aula/getAulasByContratoController.js';
import { GetAulaListService } from '../../../../src/services/aula/getAulaListService.js';
import AbstractController from '../../../../src/controllers/abstractController.js';

describe('GetAulasByContratoController', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    // Mock básico do request
    mockReq = {
      params: { id: '1' },
      t: key => {
        const translations = {
          'aulas.list.error': 'Erro ao buscar aulas'
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
      const controller = new GetAulasByContratoController(mockReq, mockRes);

      expect(controller).toBeInstanceOf(GetAulasByContratoController);
      expect(controller.req).toBe(mockReq);
      expect(controller.res).toBe(mockRes);
    });

    test('deve herdar de AbstractController', () => {
      const controller = new GetAulasByContratoController(mockReq, mockRes);

      expect(controller).toBeInstanceOf(AbstractController);
    });

    test('deve inicializar where como objeto vazio', () => {
      const controller = new GetAulasByContratoController(mockReq, mockRes);

      expect(controller.where).toEqual({});
      expect(typeof controller.where).toBe('object');
    });

    test('deve ter método execute implementado', () => {
      const controller = new GetAulasByContratoController(mockReq, mockRes);

      expect(controller.execute).toBeDefined();
      expect(typeof controller.execute).toBe('function');
    });

    test('deve ter método estático handle', () => {
      expect(GetAulasByContratoController.handle).toBeDefined();
      expect(typeof GetAulasByContratoController.handle).toBe('function');
    });
  });

  describe('Estrutura da classe', () => {
    test('deve implementar os métodos obrigatórios', () => {
      const controller = new GetAulasByContratoController(mockReq, mockRes);

      expect(typeof controller.execute).toBe('function');
      expect(typeof GetAulasByContratoController.handle).toBe('function');
    });

    test('deve armazenar req e res corretamente', () => {
      const controller = new GetAulasByContratoController(mockReq, mockRes);

      expect(controller.req).toBe(mockReq);
      expect(controller.res).toBe(mockRes);
    });

    test('deve chamar super no construtor', () => {
      const controller = new GetAulasByContratoController(mockReq, mockRes);

      // Verifica se inherited properties estão disponíveis
      expect(controller.handleError).toBeDefined();
    });
  });

  describe('Método execute()', () => {
    test('deve existir e ser uma função assíncrona', () => {
      const controller = new GetAulasByContratoController(mockReq, mockRes);

      expect(typeof controller.execute).toBe('function');
      expect(controller.execute.constructor.name).toBe('AsyncFunction');
    });

    test('deve usar ID validado quando disponível', async () => {
      mockReq.validatedId = '123';
      mockReq.params.id = '456';

      // Mock do GetAulaListService.handle
      const originalHandle = GetAulaListService.handle;
      GetAulaListService.handle = async where => {
        expect(where.idContrato).toBe('123');
        return [{ id: 'aula1', idContrato: '123' }];
      };

      const controller = new GetAulasByContratoController(mockReq, mockRes);
      await controller.execute();

      expect(mockRes.statusCode).toBe(200);

      // Restore original
      GetAulaListService.handle = originalHandle;
    });

    test('deve usar ID dos parâmetros quando validatedId não disponível', async () => {
      mockReq.validatedId = undefined;
      mockReq.params.id = '456';

      // Mock do GetAulaListService.handle
      const originalHandle = GetAulaListService.handle;
      GetAulaListService.handle = async where => {
        expect(where.idContrato).toBe('456');
        return [{ id: 'aula1', idContrato: '456' }];
      };

      const controller = new GetAulasByContratoController(mockReq, mockRes);
      await controller.execute();

      expect(mockRes.statusCode).toBe(200);

      // Restore original
      GetAulaListService.handle = originalHandle;
    });

    test('deve retornar 204 quando não houver aulas', async () => {
      // Mock do GetAulaListService.handle para retornar array vazio
      const originalHandle = GetAulaListService.handle;
      GetAulaListService.handle = async () => [];

      const controller = new GetAulasByContratoController(mockReq, mockRes);
      await controller.execute();

      expect(mockRes.statusCode).toBe(204);
      expect(mockRes.data).toBeUndefined();

      // Restore original
      GetAulaListService.handle = originalHandle;
    });

    test('deve retornar 204 quando aulas for null', async () => {
      // Mock do GetAulaListService.handle para retornar null
      const originalHandle = GetAulaListService.handle;
      GetAulaListService.handle = async () => null;

      const controller = new GetAulasByContratoController(mockReq, mockRes);
      await controller.execute();

      expect(mockRes.statusCode).toBe(204);
      expect(mockRes.data).toBeUndefined();

      // Restore original
      GetAulaListService.handle = originalHandle;
    });

    test('deve retornar 200 com array de aulas quando encontrar aulas', async () => {
      const mockAulas = [
        { id: 'aula1', idContrato: '1', titulo: 'Aula 1' },
        { id: 'aula2', idContrato: '1', titulo: 'Aula 2' }
      ];

      // Mock do GetAulaListService.handle
      const originalHandle = GetAulaListService.handle;
      GetAulaListService.handle = async () => mockAulas;

      const controller = new GetAulasByContratoController(mockReq, mockRes);
      await controller.execute();

      expect(mockRes.statusCode).toBe(200);
      expect(mockRes.data).toEqual(mockAulas);

      // Restore original
      GetAulaListService.handle = originalHandle;
    });

    test('deve configurar where corretamente com idContrato', async () => {
      mockReq.params.id = '789';

      // Mock do GetAulaListService.handle
      const originalHandle = GetAulaListService.handle;
      GetAulaListService.handle = async where => {
        expect(where).toEqual({ idContrato: '789' });
        return [];
      };

      const controller = new GetAulasByContratoController(mockReq, mockRes);
      await controller.execute();

      // Restore original
      GetAulaListService.handle = originalHandle;
    });

    test('deve chamar handleError quando ocorrer erro', async () => {
      const mockError = new Error('Database error');

      // Mock do GetAulaListService.handle para lançar erro
      const originalHandle = GetAulaListService.handle;
      GetAulaListService.handle = async () => {
        throw mockError;
      };

      const controller = new GetAulasByContratoController(mockReq, mockRes);
      await controller.execute();

      expect(mockRes.statusCode).toBe(500);
      expect(mockRes.data).toEqual({
        message: 'Erro ao buscar aulas',
        error: 'Database error'
      });

      // Restore original
      GetAulaListService.handle = originalHandle;
    });

    test('deve usar chave de tradução correta para erros', async () => {
      let translationKey = '';
      mockReq.t = key => {
        translationKey = key;
        return 'Erro ao buscar aulas';
      };

      // Mock do GetAulaListService.handle para lançar erro
      const originalHandle = GetAulaListService.handle;
      GetAulaListService.handle = async () => {
        throw new Error('Test error');
      };

      const controller = new GetAulasByContratoController(mockReq, mockRes);
      await controller.execute();

      expect(translationKey).toBe('aulas.list.error');

      // Restore original
      GetAulaListService.handle = originalHandle;
    });

    test('deve funcionar com ID undefined', async () => {
      mockReq.params.id = undefined;
      mockReq.validatedId = undefined;

      // Mock do GetAulaListService.handle
      const originalHandle = GetAulaListService.handle;
      GetAulaListService.handle = async where => {
        expect(where.idContrato).toBe(undefined);
        return [];
      };

      const controller = new GetAulasByContratoController(mockReq, mockRes);
      await controller.execute();

      expect(mockRes.statusCode).toBe(204);

      // Restore original
      GetAulaListService.handle = originalHandle;
    });
  });

  describe('Método estático handle()', () => {
    test('deve ser uma função estática', () => {
      expect(typeof GetAulasByContratoController.handle).toBe('function');
      expect(GetAulasByContratoController.handle).not.toBe(AbstractController.handle);
    });

    test('deve ser uma função assíncrona', () => {
      expect(GetAulasByContratoController.handle.constructor.name).toBe('AsyncFunction');
    });

    test('deve criar nova instância do controller a cada chamada', async () => {
      // Mock simples
      const originalHandle = GetAulaListService.handle;
      GetAulaListService.handle = async () => [{ id: 1 }];

      await GetAulasByContratoController.handle(mockReq, mockRes);

      expect(mockRes.statusCode).toBe(200);

      // Restore original
      GetAulaListService.handle = originalHandle;
    });

    test('deve aceitar parâmetros req e res', () => {
      const handleMethod = GetAulasByContratoController.handle;
      expect(handleMethod).toBeDefined();
      expect(handleMethod.length).toBe(2);
    });

    test('deve passar req e res para nova instância', async () => {
      const originalHandle = GetAulaListService.handle;
      GetAulaListService.handle = async () => [{ id: 'aula1' }];

      await GetAulasByContratoController.handle(mockReq, mockRes);

      expect(mockRes.statusCode).toBe(200);

      // Restore original
      GetAulaListService.handle = originalHandle;
    });

    test('deve executar o método execute da instância', async () => {
      const originalHandle = GetAulaListService.handle;
      let executeCalled = false;

      GetAulaListService.handle = async () => {
        executeCalled = true;
        return [{ id: 'aula1' }];
      };

      await GetAulasByContratoController.handle(mockReq, mockRes);

      expect(executeCalled).toBe(true);

      // Restore original
      GetAulaListService.handle = originalHandle;
    });

    test('deve tratar erros adequadamente no método estático', async () => {
      const originalHandle = GetAulaListService.handle;
      GetAulaListService.handle = async () => {
        throw new Error('Static method error');
      };

      await GetAulasByContratoController.handle(mockReq, mockRes);

      expect(mockRes.statusCode).toBe(500);
      expect(mockRes.data.message).toBe('Erro ao buscar aulas');

      // Restore original
      GetAulaListService.handle = originalHandle;
    });
  });

  describe('Integração entre métodos', () => {
    test('deve processar fluxo completo com sucesso', async () => {
      mockReq.params.id = 'contrato-123';

      const originalHandle = GetAulaListService.handle;
      GetAulaListService.handle = async where => {
        expect(where.idContrato).toBe('contrato-123');
        return [
          { id: 'aula1', idContrato: 'contrato-123', titulo: 'Aula 1' },
          { id: 'aula2', idContrato: 'contrato-123', titulo: 'Aula 2' }
        ];
      };

      const controller = new GetAulasByContratoController(mockReq, mockRes);
      await controller.execute();

      expect(mockRes.statusCode).toBe(200);
      expect(Array.isArray(mockRes.data)).toBe(true);
      expect(mockRes.data.length).toBe(2);

      // Restore original
      GetAulaListService.handle = originalHandle;
    });

    test('deve processar fluxo completo sem resultados', async () => {
      const originalHandle = GetAulaListService.handle;
      GetAulaListService.handle = async () => [];

      const controller = new GetAulasByContratoController(mockReq, mockRes);
      await controller.execute();

      expect(mockRes.statusCode).toBe(204);

      // Restore original
      GetAulaListService.handle = originalHandle;
    });
  });

  describe('Validações de entrada', () => {
    test('deve aceitar string como ID do contrato', async () => {
      mockReq.params.id = 'abc-123-def';

      const originalHandle = GetAulaListService.handle;
      GetAulaListService.handle = async where => {
        expect(typeof where.idContrato).toBe('string');
        expect(where.idContrato).toBe('abc-123-def');
        return [];
      };

      const controller = new GetAulasByContratoController(mockReq, mockRes);
      await controller.execute();

      // Restore original
      GetAulaListService.handle = originalHandle;
    });

    test('deve aceitar número como ID do contrato', async () => {
      mockReq.params.id = 999;

      const originalHandle = GetAulaListService.handle;
      GetAulaListService.handle = async where => {
        expect(where.idContrato).toBe(999);
        return [];
      };

      const controller = new GetAulasByContratoController(mockReq, mockRes);
      await controller.execute();

      // Restore original
      GetAulaListService.handle = originalHandle;
    });
  });

  describe('Tratamento de respostas', () => {
    test('deve retornar resposta vazia com status 204 para array vazio', async () => {
      const originalHandle = GetAulaListService.handle;
      GetAulaListService.handle = async () => [];

      const controller = new GetAulasByContratoController(mockReq, mockRes);
      await controller.execute();

      expect(mockRes.statusCode).toBe(204);
      expect(mockRes.data).toBeUndefined();

      // Restore original
      GetAulaListService.handle = originalHandle;
    });

    test('deve retornar dados completos com status 200', async () => {
      const mockData = [{ id: '1', idContrato: '1', titulo: 'Test Aula' }];

      const originalHandle = GetAulaListService.handle;
      GetAulaListService.handle = async () => mockData;

      const controller = new GetAulasByContratoController(mockReq, mockRes);
      await controller.execute();

      expect(mockRes.statusCode).toBe(200);
      expect(mockRes.data).toEqual(mockData);

      // Restore original
      GetAulaListService.handle = originalHandle;
    });
  });
});
