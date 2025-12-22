import { GetAulasByAlunoController } from '../../../../src/controllers/aula/getAulasByAlunoController.js';
import { GetAulaListService } from '../../../../src/services/aula/getAulaListService.js';
import AbstractController from '../../../../src/controllers/abstractController.js';

describe('GetAulasByAlunoController', () => {
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
      const controller = new GetAulasByAlunoController(mockReq, mockRes);

      expect(controller).toBeInstanceOf(GetAulasByAlunoController);
      expect(controller.req).toBe(mockReq);
      expect(controller.res).toBe(mockRes);
    });

    test('deve herdar de AbstractController', () => {
      const controller = new GetAulasByAlunoController(mockReq, mockRes);

      expect(controller).toBeInstanceOf(AbstractController);
    });

    test('deve inicializar where como objeto vazio', () => {
      const controller = new GetAulasByAlunoController(mockReq, mockRes);

      expect(controller.where).toEqual({});
      expect(typeof controller.where).toBe('object');
    });

    test('deve ter método execute implementado', () => {
      const controller = new GetAulasByAlunoController(mockReq, mockRes);

      expect(controller.execute).toBeDefined();
      expect(typeof controller.execute).toBe('function');
    });

    test('deve ter método estático handle', () => {
      expect(GetAulasByAlunoController.handle).toBeDefined();
      expect(typeof GetAulasByAlunoController.handle).toBe('function');
    });
  });

  describe('Estrutura da classe', () => {
    test('deve implementar os métodos obrigatórios', () => {
      const controller = new GetAulasByAlunoController(mockReq, mockRes);

      expect(typeof controller.execute).toBe('function');
      expect(typeof GetAulasByAlunoController.handle).toBe('function');
    });

    test('deve armazenar req e res corretamente', () => {
      const controller = new GetAulasByAlunoController(mockReq, mockRes);

      expect(controller.req).toBe(mockReq);
      expect(controller.res).toBe(mockRes);
    });

    test('deve chamar super no construtor', () => {
      const controller = new GetAulasByAlunoController(mockReq, mockRes);

      // Verifica se inherited properties estão disponíveis
      expect(controller.handleError).toBeDefined();
    });
  });

  describe('Método execute()', () => {
    test('deve existir e ser uma função assíncrona', () => {
      const controller = new GetAulasByAlunoController(mockReq, mockRes);

      expect(typeof controller.execute).toBe('function');
      expect(controller.execute.constructor.name).toBe('AsyncFunction');
    });

    test('deve usar ID validado quando disponível', async () => {
      mockReq.validatedId = '123';
      mockReq.params.id = '456';

      // Mock do GetAulaListService.handle
      const originalHandle = GetAulaListService.handle;
      GetAulaListService.handle = async where => {
        expect(where.idAluno).toBe('123');
        return [{ id: 'aula1', idAluno: '123' }];
      };

      const controller = new GetAulasByAlunoController(mockReq, mockRes);
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
        expect(where.idAluno).toBe('456');
        return [{ id: 'aula1', idAluno: '456' }];
      };

      const controller = new GetAulasByAlunoController(mockReq, mockRes);
      await controller.execute();

      expect(mockRes.statusCode).toBe(200);

      // Restore original
      GetAulaListService.handle = originalHandle;
    });

    test('deve retornar 204 quando não houver aulas', async () => {
      // Mock do GetAulaListService.handle para retornar array vazio
      const originalHandle = GetAulaListService.handle;
      GetAulaListService.handle = async () => [];

      const controller = new GetAulasByAlunoController(mockReq, mockRes);
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

      const controller = new GetAulasByAlunoController(mockReq, mockRes);
      await controller.execute();

      expect(mockRes.statusCode).toBe(204);
      expect(mockRes.data).toBeUndefined();

      // Restore original
      GetAulaListService.handle = originalHandle;
    });

    test('deve retornar 200 com array de aulas quando encontrar aulas', async () => {
      const mockAulas = [
        { id: 'aula1', idAluno: '1', titulo: 'Aula 1' },
        { id: 'aula2', idAluno: '1', titulo: 'Aula 2' }
      ];

      // Mock do GetAulaListService.handle
      const originalHandle = GetAulaListService.handle;
      GetAulaListService.handle = async () => mockAulas;

      const controller = new GetAulasByAlunoController(mockReq, mockRes);
      await controller.execute();

      expect(mockRes.statusCode).toBe(200);
      expect(mockRes.data).toEqual(mockAulas);

      // Restore original
      GetAulaListService.handle = originalHandle;
    });

    test('deve configurar where corretamente com idAluno', async () => {
      mockReq.params.id = '789';

      // Mock do GetAulaListService.handle
      const originalHandle = GetAulaListService.handle;
      GetAulaListService.handle = async where => {
        expect(where).toEqual({ idAluno: '789' });
        return [];
      };

      const controller = new GetAulasByAlunoController(mockReq, mockRes);
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

      const controller = new GetAulasByAlunoController(mockReq, mockRes);
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

      const controller = new GetAulasByAlunoController(mockReq, mockRes);
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
        expect(where.idAluno).toBe(undefined);
        return [];
      };

      const controller = new GetAulasByAlunoController(mockReq, mockRes);
      await controller.execute();

      expect(mockRes.statusCode).toBe(204);

      // Restore original
      GetAulaListService.handle = originalHandle;
    });
  });

  describe('Método estático handle()', () => {
    test('deve ser uma função estática', () => {
      expect(typeof GetAulasByAlunoController.handle).toBe('function');
      expect(GetAulasByAlunoController.handle).not.toBe(AbstractController.handle);
    });

    test('deve ser uma função assíncrona', () => {
      expect(GetAulasByAlunoController.handle.constructor.name).toBe('AsyncFunction');
    });

    test('deve criar nova instância do controller a cada chamada', async () => {
      // Mock simples
      const originalHandle = GetAulaListService.handle;
      GetAulaListService.handle = async () => [{ id: 1 }];

      await GetAulasByAlunoController.handle(mockReq, mockRes);

      expect(mockRes.statusCode).toBe(200);

      // Restore original
      GetAulaListService.handle = originalHandle;
    });

    test('deve aceitar parâmetros req e res', () => {
      const handleMethod = GetAulasByAlunoController.handle;
      expect(handleMethod).toBeDefined();
      expect(handleMethod.length).toBe(2);
    });

    test('deve chamar execute internamente', async () => {
      // Mock do GetAulaListService.handle
      const originalHandle = GetAulaListService.handle;
      GetAulaListService.handle = async () => [{ id: 'aula1' }];

      await GetAulasByAlunoController.handle(mockReq, mockRes);

      expect(mockRes.statusCode).toBe(200);
      expect(mockRes.data).toEqual([{ id: 'aula1' }]);

      // Restore original
      GetAulaListService.handle = originalHandle;
    });
  });

  describe('Integração com AbstractController', () => {
    test('deve ter acesso aos métodos da classe pai', () => {
      const controller = new GetAulasByAlunoController(mockReq, mockRes);

      expect(controller.handleError).toBeDefined();
      expect(typeof controller.handleError).toBe('function');
    });

    test('deve ser uma subclasse de AbstractController', () => {
      const controller = new GetAulasByAlunoController(mockReq, mockRes);

      expect(controller instanceof AbstractController).toBe(true);
      expect(controller instanceof GetAulasByAlunoController).toBe(true);
    });

    test('deve herdar propriedades da classe pai', () => {
      const controller = new GetAulasByAlunoController(mockReq, mockRes);

      expect(controller.req).toBe(mockReq);
      expect(controller.res).toBe(mockRes);
    });
  });

  describe('Casos específicos', () => {
    test('deve lidar com array vazio de aulas', async () => {
      const originalHandle = GetAulaListService.handle;
      GetAulaListService.handle = async () => [];

      const controller = new GetAulasByAlunoController(mockReq, mockRes);
      await controller.execute();

      expect(mockRes.statusCode).toBe(204);

      GetAulaListService.handle = originalHandle;
    });

    test('deve lidar com múltiplas aulas', async () => {
      const mockAulas = [
        { id: 'aula1', idAluno: '1' },
        { id: 'aula2', idAluno: '1' },
        { id: 'aula3', idAluno: '1' }
      ];

      const originalHandle = GetAulaListService.handle;
      GetAulaListService.handle = async () => mockAulas;

      const controller = new GetAulasByAlunoController(mockReq, mockRes);
      await controller.execute();

      expect(mockRes.statusCode).toBe(200);
      expect(mockRes.data).toHaveLength(3);
      expect(mockRes.data).toEqual(mockAulas);

      GetAulaListService.handle = originalHandle;
    });

    test('deve preservar where após execução', async () => {
      mockReq.params.id = '999';

      const originalHandle = GetAulaListService.handle;
      GetAulaListService.handle = async () => [];

      const controller = new GetAulasByAlunoController(mockReq, mockRes);
      await controller.execute();

      expect(controller.where).toEqual({ idAluno: '999' });

      GetAulaListService.handle = originalHandle;
    });

    test('deve retornar dados estruturados corretamente', async () => {
      const mockAulas = [
        {
          id: 'aula1',
          idAluno: '1',
          titulo: 'Matemática Básica',
          data: '2025-12-04',
          horario: '14:00'
        }
      ];

      const originalHandle = GetAulaListService.handle;
      GetAulaListService.handle = async () => mockAulas;

      const controller = new GetAulasByAlunoController(mockReq, mockRes);
      await controller.execute();

      expect(mockRes.statusCode).toBe(200);
      expect(mockRes.data[0]).toHaveProperty('id');
      expect(mockRes.data[0]).toHaveProperty('idAluno');
      expect(mockRes.data[0]).toHaveProperty('titulo');
      expect(mockRes.data[0].idAluno).toBe('1');

      GetAulaListService.handle = originalHandle;
    });
  });
});
