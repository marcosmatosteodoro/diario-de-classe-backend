import { GetContratosByAlunoController } from '../../../../src/controllers/contrato/getContratosByAlunoController.js';
import { GetContratoListService } from '../../../../src/services/contrato/getContratoListService.js';
import AbstractController from '../../../../src/controllers/abstractController.js';

describe('GetContratosByAlunoController', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    // Mock básico do request
    mockReq = {
      params: { id: '1' },
      t: key => {
        const translations = {
          'contratos.get.not_found': 'Contratos não encontrados',
          'contratos.get.error': 'Erro ao buscar contratos'
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
      const controller = new GetContratosByAlunoController(mockReq, mockRes);

      expect(controller).toBeInstanceOf(GetContratosByAlunoController);
      expect(controller.req).toBe(mockReq);
      expect(controller.res).toBe(mockRes);
    });

    test('deve herdar de AbstractController', () => {
      const controller = new GetContratosByAlunoController(mockReq, mockRes);

      expect(controller).toBeInstanceOf(AbstractController);
    });

    test('deve inicializar where como objeto vazio', () => {
      const controller = new GetContratosByAlunoController(mockReq, mockRes);

      expect(controller.where).toEqual({});
      expect(typeof controller.where).toBe('object');
    });

    test('deve ter método execute implementado', () => {
      const controller = new GetContratosByAlunoController(mockReq, mockRes);

      expect(controller.execute).toBeDefined();
      expect(typeof controller.execute).toBe('function');
    });

    test('deve ter método estático handle', () => {
      expect(GetContratosByAlunoController.handle).toBeDefined();
      expect(typeof GetContratosByAlunoController.handle).toBe('function');
    });
  });

  describe('Estrutura da classe', () => {
    test('deve implementar os métodos obrigatórios', () => {
      const controller = new GetContratosByAlunoController(mockReq, mockRes);

      expect(typeof controller.execute).toBe('function');
      expect(typeof GetContratosByAlunoController.handle).toBe('function');
    });

    test('deve armazenar req e res corretamente', () => {
      const controller = new GetContratosByAlunoController(mockReq, mockRes);

      expect(controller.req).toBe(mockReq);
      expect(controller.res).toBe(mockRes);
    });

    test('deve chamar super no construtor', () => {
      const controller = new GetContratosByAlunoController(mockReq, mockRes);

      // Verifica se inherited properties estão disponíveis
      expect(controller.handleError).toBeDefined();
    });
  });

  describe('Método execute()', () => {
    test('deve existir e ser uma função assíncrona', () => {
      const controller = new GetContratosByAlunoController(mockReq, mockRes);

      expect(typeof controller.execute).toBe('function');
      expect(controller.execute.constructor.name).toBe('AsyncFunction');
    });

    test('deve usar ID validado quando disponível', async () => {
      mockReq.validatedId = '123';
      mockReq.params.id = '456';

      // Mock do GetContratoListService.handle
      const originalHandle = GetContratoListService.handle;
      GetContratoListService.handle = async where => {
        expect(where.idAluno).toBe('123');
        return [{ id: 'contrato1', idAluno: '123' }];
      };

      const controller = new GetContratosByAlunoController(mockReq, mockRes);
      await controller.execute();

      expect(mockRes.statusCode).toBe(200);

      // Restore original
      GetContratoListService.handle = originalHandle;
    });

    test('deve usar ID dos parâmetros quando validatedId não disponível', async () => {
      mockReq.validatedId = undefined;
      mockReq.params.id = '456';

      // Mock do GetContratoListService.handle
      const originalHandle = GetContratoListService.handle;
      GetContratoListService.handle = async where => {
        expect(where.idAluno).toBe('456');
        return [{ id: 'contrato1', idAluno: '456' }];
      };

      const controller = new GetContratosByAlunoController(mockReq, mockRes);
      await controller.execute();

      expect(mockRes.statusCode).toBe(200);

      // Restore original
      GetContratoListService.handle = originalHandle;
    });

    test('deve retornar 404 quando não houver contratos', async () => {
      // Mock do GetContratoListService.handle para retornar array vazio
      const originalHandle = GetContratoListService.handle;
      GetContratoListService.handle = async () => [];

      const controller = new GetContratosByAlunoController(mockReq, mockRes);
      await controller.execute();

      expect(mockRes.statusCode).toBe(404);
      expect(mockRes.data).toEqual({
        message: 'Contratos não encontrados'
      });

      // Restore original
      GetContratoListService.handle = originalHandle;
    });

    test('deve retornar 404 quando contratos for null', async () => {
      // Mock do GetContratoListService.handle para retornar null
      const originalHandle = GetContratoListService.handle;
      GetContratoListService.handle = async () => null;

      const controller = new GetContratosByAlunoController(mockReq, mockRes);
      await controller.execute();

      expect(mockRes.statusCode).toBe(404);
      expect(mockRes.data).toEqual({
        message: 'Contratos não encontrados'
      });

      // Restore original
      GetContratoListService.handle = originalHandle;
    });

    test('deve retornar 200 com array de contratos quando encontrar contratos', async () => {
      const mockContratos = [
        { id: 'contrato1', idAluno: '1', valor: 100 },
        { id: 'contrato2', idAluno: '1', valor: 200 }
      ];

      // Mock do GetContratoListService.handle
      const originalHandle = GetContratoListService.handle;
      GetContratoListService.handle = async () => mockContratos;

      const controller = new GetContratosByAlunoController(mockReq, mockRes);
      await controller.execute();

      expect(mockRes.statusCode).toBe(200);
      expect(mockRes.data).toEqual(mockContratos);

      // Restore original
      GetContratoListService.handle = originalHandle;
    });

    test('deve configurar where corretamente com idAluno', async () => {
      mockReq.params.id = '789';

      // Mock do GetContratoListService.handle
      const originalHandle = GetContratoListService.handle;
      GetContratoListService.handle = async where => {
        expect(where).toEqual({ idAluno: '789' });
        return [{ id: 'contrato1' }];
      };

      const controller = new GetContratosByAlunoController(mockReq, mockRes);
      await controller.execute();

      // Restore original
      GetContratoListService.handle = originalHandle;
    });

    test('deve chamar handleError quando ocorrer erro', async () => {
      const mockError = new Error('Database error');

      // Mock do GetContratoListService.handle para lançar erro
      const originalHandle = GetContratoListService.handle;
      GetContratoListService.handle = async () => {
        throw mockError;
      };

      const controller = new GetContratosByAlunoController(mockReq, mockRes);
      await controller.execute();

      expect(mockRes.statusCode).toBe(500);
      expect(mockRes.data).toEqual({
        message: 'Erro ao buscar contratos',
        error: 'Database error'
      });

      // Restore original
      GetContratoListService.handle = originalHandle;
    });

    test('deve usar chave de tradução correta para not_found', async () => {
      let translationKey = '';
      mockReq.t = key => {
        translationKey = key;
        return 'Contratos não encontrados';
      };

      // Mock do GetContratoListService.handle para retornar array vazio
      const originalHandle = GetContratoListService.handle;
      GetContratoListService.handle = async () => [];

      const controller = new GetContratosByAlunoController(mockReq, mockRes);
      await controller.execute();

      expect(translationKey).toBe('contratos.get.not_found');

      // Restore original
      GetContratoListService.handle = originalHandle;
    });

    test('deve usar chave de tradução correta para erros', async () => {
      let translationKey = '';
      mockReq.t = key => {
        translationKey = key;
        return 'Erro ao buscar contratos';
      };

      // Mock do GetContratoListService.handle para lançar erro
      const originalHandle = GetContratoListService.handle;
      GetContratoListService.handle = async () => {
        throw new Error('Test error');
      };

      const controller = new GetContratosByAlunoController(mockReq, mockRes);
      await controller.execute();

      expect(translationKey).toBe('contratos.get.error');

      // Restore original
      GetContratoListService.handle = originalHandle;
    });

    test('deve funcionar com ID undefined', async () => {
      mockReq.params.id = undefined;
      mockReq.validatedId = undefined;

      // Mock do GetContratoListService.handle
      const originalHandle = GetContratoListService.handle;
      GetContratoListService.handle = async where => {
        expect(where.idAluno).toBe(undefined);
        return [];
      };

      const controller = new GetContratosByAlunoController(mockReq, mockRes);
      await controller.execute();

      expect(mockRes.statusCode).toBe(404);

      // Restore original
      GetContratoListService.handle = originalHandle;
    });
  });

  describe('Método estático handle()', () => {
    test('deve ser uma função estática', () => {
      expect(typeof GetContratosByAlunoController.handle).toBe('function');
      expect(GetContratosByAlunoController.handle).not.toBe(AbstractController.handle);
    });

    test('deve ser uma função assíncrona', () => {
      expect(GetContratosByAlunoController.handle.constructor.name).toBe('AsyncFunction');
    });

    test('deve criar nova instância do controller a cada chamada', async () => {
      // Mock simples
      const originalHandle = GetContratoListService.handle;
      GetContratoListService.handle = async () => [{ id: 1 }];

      await GetContratosByAlunoController.handle(mockReq, mockRes);

      expect(mockRes.statusCode).toBe(200);

      // Restore original
      GetContratoListService.handle = originalHandle;
    });

    test('deve aceitar parâmetros req e res', () => {
      const handleMethod = GetContratosByAlunoController.handle;
      expect(handleMethod).toBeDefined();
      expect(handleMethod.length).toBe(2);
    });

    test('deve chamar execute internamente', async () => {
      // Mock do GetContratoListService.handle
      const originalHandle = GetContratoListService.handle;
      GetContratoListService.handle = async () => [{ id: 'contrato1' }];

      await GetContratosByAlunoController.handle(mockReq, mockRes);

      expect(mockRes.statusCode).toBe(200);
      expect(mockRes.data).toEqual([{ id: 'contrato1' }]);

      // Restore original
      GetContratoListService.handle = originalHandle;
    });
  });

  describe('Integração com AbstractController', () => {
    test('deve ter acesso aos métodos da classe pai', () => {
      const controller = new GetContratosByAlunoController(mockReq, mockRes);

      expect(controller.handleError).toBeDefined();
      expect(typeof controller.handleError).toBe('function');
    });

    test('deve ser uma subclasse de AbstractController', () => {
      const controller = new GetContratosByAlunoController(mockReq, mockRes);

      expect(controller instanceof AbstractController).toBe(true);
      expect(controller instanceof GetContratosByAlunoController).toBe(true);
    });

    test('deve herdar propriedades da classe pai', () => {
      const controller = new GetContratosByAlunoController(mockReq, mockRes);

      expect(controller.req).toBe(mockReq);
      expect(controller.res).toBe(mockRes);
    });
  });

  describe('Casos específicos', () => {
    test('deve lidar com array vazio de contratos', async () => {
      const originalHandle = GetContratoListService.handle;
      GetContratoListService.handle = async () => [];

      const controller = new GetContratosByAlunoController(mockReq, mockRes);
      await controller.execute();

      expect(mockRes.statusCode).toBe(404);

      GetContratoListService.handle = originalHandle;
    });

    test('deve lidar com múltiplos contratos', async () => {
      const mockContratos = [
        { id: 'contrato1', idAluno: '1' },
        { id: 'contrato2', idAluno: '1' },
        { id: 'contrato3', idAluno: '1' }
      ];

      const originalHandle = GetContratoListService.handle;
      GetContratoListService.handle = async () => mockContratos;

      const controller = new GetContratosByAlunoController(mockReq, mockRes);
      await controller.execute();

      expect(mockRes.statusCode).toBe(200);
      expect(mockRes.data).toHaveLength(3);
      expect(mockRes.data).toEqual(mockContratos);

      GetContratoListService.handle = originalHandle;
    });

    test('deve preservar where após execução', async () => {
      mockReq.params.id = '999';

      const originalHandle = GetContratoListService.handle;
      GetContratoListService.handle = async () => [{ id: 'contrato1' }];

      const controller = new GetContratosByAlunoController(mockReq, mockRes);
      await controller.execute();

      expect(controller.where).toEqual({ idAluno: '999' });

      GetContratoListService.handle = originalHandle;
    });

    test('deve retornar dados estruturados corretamente', async () => {
      const mockContratos = [
        {
          id: 'contrato1',
          idAluno: '1',
          valor: 1500,
          status: 'ATIVO',
          dataInicio: '2025-01-01'
        }
      ];

      const originalHandle = GetContratoListService.handle;
      GetContratoListService.handle = async () => mockContratos;

      const controller = new GetContratosByAlunoController(mockReq, mockRes);
      await controller.execute();

      expect(mockRes.statusCode).toBe(200);
      expect(mockRes.data[0]).toHaveProperty('id');
      expect(mockRes.data[0]).toHaveProperty('idAluno');
      expect(mockRes.data[0]).toHaveProperty('valor');
      expect(mockRes.data[0].idAluno).toBe('1');

      GetContratoListService.handle = originalHandle;
    });
  });
});
