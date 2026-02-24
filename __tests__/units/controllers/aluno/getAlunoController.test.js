import { GetAlunoController } from '../../../../src/controllers/aluno/getAlunoController.js';
import { GetAlunoService } from '../../../../src/services/aluno/getAlunoService.js';
import AbstractController from '../../../../src/controllers/abstractController.js';

describe('GetAlunoController', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    // Mock básico do request
    mockReq = {
      params: { id: '1' },
      user: {
        id: 'admin-default',
        isAdmin: true
      },
      t: key => {
        const translations = {
          'alunos.get.not_found': 'Aluno não encontrado',
          'alunos.get.error': 'Erro ao buscar aluno'
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
      const controller = new GetAlunoController(mockReq, mockRes);

      expect(controller).toBeInstanceOf(GetAlunoController);
      expect(controller.req).toBe(mockReq);
      expect(controller.res).toBe(mockRes);
    });

    test('deve herdar de AbstractController', () => {
      const controller = new GetAlunoController(mockReq, mockRes);

      expect(controller).toBeInstanceOf(AbstractController);
    });

    test('deve ter método execute implementado', () => {
      const controller = new GetAlunoController(mockReq, mockRes);

      expect(controller.execute).toBeDefined();
      expect(typeof controller.execute).toBe('function');
    });

    test('deve ter método estático handle', () => {
      expect(GetAlunoController.handle).toBeDefined();
      expect(typeof GetAlunoController.handle).toBe('function');
    });
  });

  describe('Estrutura da classe', () => {
    test('deve implementar os métodos obrigatórios', () => {
      const controller = new GetAlunoController(mockReq, mockRes);

      expect(typeof controller.execute).toBe('function');
      expect(typeof GetAlunoController.handle).toBe('function');
    });

    test('deve armazenar req e res corretamente', () => {
      const controller = new GetAlunoController(mockReq, mockRes);

      expect(controller.req).toBe(mockReq);
      expect(controller.res).toBe(mockRes);
    });

    test('deve chamar super no construtor', () => {
      const controller = new GetAlunoController(mockReq, mockRes);

      // Verifica se inherited properties estão disponíveis
      expect(controller.handleError).toBeDefined();
    });
  });

  describe('Método execute()', () => {
    test('deve existir e ser uma função assíncrona', () => {
      const controller = new GetAlunoController(mockReq, mockRes);

      expect(typeof controller.execute).toBe('function');
      expect(controller.execute.constructor.name).toBe('AsyncFunction');
    });

    test('deve usar ID validado quando disponível', async () => {
      mockReq.validatedId = '123';
      mockReq.params.id = '456';

      // Mock do GetAlunoService.handle para verificar o ID recebido
      const originalHandle = GetAlunoService.handle;
      GetAlunoService.handle = async id => {
        expect(id).toBe('123');
        return null;
      };

      const controller = new GetAlunoController(mockReq, mockRes);
      await controller.execute();

      // Restore original
      GetAlunoService.handle = originalHandle;
    });

    test('deve usar ID dos parâmetros quando validatedId não disponível', async () => {
      mockReq.validatedId = undefined;
      mockReq.params.id = '456';

      // Mock do GetAlunoService.handle para verificar o ID recebido
      const originalHandle = GetAlunoService.handle;
      GetAlunoService.handle = async id => {
        expect(id).toBe('456');
        return null;
      };

      const controller = new GetAlunoController(mockReq, mockRes);
      await controller.execute();

      // Restore original
      GetAlunoService.handle = originalHandle;
    });

    test('deve retornar 404 quando aluno não for encontrado', async () => {
      // Mock do GetAlunoService.handle para retornar null
      const originalHandle = GetAlunoService.handle;
      GetAlunoService.handle = async () => null;

      const controller = new GetAlunoController(mockReq, mockRes);
      await controller.execute();

      expect(mockRes.statusCode).toBe(404);
      expect(mockRes.data).toEqual({
        message: 'Aluno não encontrado'
      });

      // Restore original
      GetAlunoService.handle = originalHandle;
    });

    test('deve usar chave de tradução correta para not_found', async () => {
      let translationKey = '';
      mockReq.t = key => {
        translationKey = key;
        return 'Aluno não encontrado';
      };

      // Mock do GetAlunoService.handle para retornar null
      const originalHandle = GetAlunoService.handle;
      GetAlunoService.handle = async () => null;

      const controller = new GetAlunoController(mockReq, mockRes);
      await controller.execute();

      expect(translationKey).toBe('alunos.get.not_found');

      // Restore original
      GetAlunoService.handle = originalHandle;
    });

    test('deve funcionar com ID undefined', async () => {
      mockReq.params.id = undefined;
      mockReq.validatedId = undefined;

      // Mock do GetAlunoService.handle
      const originalHandle = GetAlunoService.handle;
      GetAlunoService.handle = async id => {
        expect(id).toBe(undefined);
        return null;
      };

      const controller = new GetAlunoController(mockReq, mockRes);
      await controller.execute();

      expect(mockRes.statusCode).toBe(404);

      // Restore original
      GetAlunoService.handle = originalHandle;
    });
  });

  describe('Método estático handle()', () => {
    test('deve ser uma função estática', () => {
      expect(typeof GetAlunoController.handle).toBe('function');
      expect(GetAlunoController.handle).not.toBe(AbstractController.handle);
    });

    test('deve criar nova instância do controller a cada chamada', async () => {
      // Mock simples
      const originalHandle = GetAlunoService.handle;
      GetAlunoService.handle = async () => ({ id: 1 });

      await GetAlunoController.handle(mockReq, mockRes);
      expect(mockRes.statusCode).toBe(200);

      // Restore original
      GetAlunoService.handle = originalHandle;
    });
  });

  describe('Integração com AbstractController', () => {
    test('deve implementar método execute() abstrato', () => {
      const controller = new GetAlunoController(mockReq, mockRes);

      expect(controller.execute).toBeDefined();
      expect(controller.execute).not.toBe(AbstractController.prototype.execute);
    });

    test('deve ter acesso ao método handleError da classe pai', () => {
      const controller = new GetAlunoController(mockReq, mockRes);

      expect(controller.handleError).toBeDefined();
      expect(typeof controller.handleError).toBe('function');
    });

    test('deve ser uma subclasse de AbstractController através de AbstractAlunoController', () => {
      expect(GetAlunoController.prototype).toBeInstanceOf(Object);
      // GetAlunoController herda de AbstractAlunoController que herda de AbstractController
      const proto = Object.getPrototypeOf(GetAlunoController.prototype);
      expect(proto.constructor.name).toBe('AbstractAlunoController');
      expect(Object.getPrototypeOf(proto)).toBe(AbstractController.prototype);
    });

    test('deve implementar método handle() estático', () => {
      expect(typeof GetAlunoController.handle).toBe('function');
      expect(GetAlunoController.handle).not.toBe(AbstractController.handle);
    });
  });

  describe('Cenários de sucesso', () => {
    test('deve retornar aluno com status 200', async () => {
      const mockAluno = {
        id: 1,
        nome: 'João',
        email: 'joao@email.com'
      };

      // Mock do GetAlunoService.handle
      const originalHandle = GetAlunoService.handle;
      GetAlunoService.handle = async () => mockAluno;

      const controller = new GetAlunoController(mockReq, mockRes);
      await controller.execute();

      expect(mockRes.statusCode).toBe(200);
      expect(mockRes.data).toEqual(mockAluno);

      // Restore original
      GetAlunoService.handle = originalHandle;
    });

    test('deve retornar objeto completo do aluno', async () => {
      const mockAluno = {
        id: 1,
        nome: 'João Silva',
        sobrenome: 'Santos',
        email: 'joao@email.com',
        telefone: '11999999999',
        endereco: 'Rua das Flores, 123',
        dataNascimento: '1990-01-01',
        observacoes: 'Aluno dedicado',
        dataCriacao: '2024-01-01',
        dataAtualizacao: '2024-01-02'
      };

      // Mock do GetAlunoService.handle
      const originalHandle = GetAlunoService.handle;
      GetAlunoService.handle = async () => mockAluno;

      const controller = new GetAlunoController(mockReq, mockRes);
      await controller.execute();

      expect(mockRes.statusCode).toBe(200);
      expect(mockRes.data).toEqual(mockAluno);

      // Restore original
      GetAlunoService.handle = originalHandle;
    });
  });

  describe('Tratamento de erros', () => {
    test('deve chamar handleError quando ocorrer exceção', async () => {
      const mockError = new Error('Erro de conexão');

      // Mock do GetAlunoService.handle para lançar erro
      const originalHandle = GetAlunoService.handle;
      GetAlunoService.handle = async () => {
        throw mockError;
      };

      const controller = new GetAlunoController(mockReq, mockRes);

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
      expect(keyReceived).toBe('alunos.get.error');

      // Restore original
      GetAlunoService.handle = originalHandle;
    });

    test('deve usar chave de tradução correta para erro', async () => {
      const mockError = new Error('Service error');

      // Mock do GetAlunoService.handle para lançar erro
      const originalHandle = GetAlunoService.handle;
      GetAlunoService.handle = async () => {
        throw mockError;
      };

      const controller = new GetAlunoController(mockReq, mockRes);

      let translationKey = '';
      controller.handleError = (error, key) => {
        translationKey = key;
      };

      await controller.execute();

      expect(translationKey).toBe('alunos.get.error');

      // Restore original
      GetAlunoService.handle = originalHandle;
    });
  });

  describe('Validação de parâmetros', () => {
    test('deve funcionar com diferentes IDs', async () => {
      const testCases = ['1', '123', 'abc', null, undefined];

      // Mock do GetAlunoService.handle
      const originalHandle = GetAlunoService.handle;
      const receivedIds = [];

      GetAlunoService.handle = async id => {
        receivedIds.push(id);
        return null;
      };

      for (const testId of testCases) {
        mockReq.params.id = testId;
        mockReq.validatedId = undefined;
        const controller = new GetAlunoController(mockReq, mockRes);
        await controller.execute();
      }

      expect(receivedIds).toEqual(testCases);

      // Restore original
      GetAlunoService.handle = originalHandle;
    });

    test('deve priorizar validatedId sobre params.id', async () => {
      const validatedId = 'validated-123';
      const paramsId = 'params-456';

      mockReq.validatedId = validatedId;
      mockReq.params.id = paramsId;

      // Mock do GetAlunoService.handle
      const originalHandle = GetAlunoService.handle;
      let receivedId = null;

      GetAlunoService.handle = async id => {
        receivedId = id;
        return { id: 1, nome: 'Teste' };
      };

      const controller = new GetAlunoController(mockReq, mockRes);
      await controller.execute();

      expect(receivedId).toBe(validatedId);

      // Restore original
      GetAlunoService.handle = originalHandle;
    });
  });

  describe('Cenários específicos do Aluno', () => {
    test('deve retornar aluno com campos específicos', async () => {
      const mockAluno = {
        id: 1,
        nome: 'Maria',
        sobrenome: 'Silva',
        email: 'maria@email.com',
        telefone: '11988887777',
        endereco: 'Av. Principal, 456',
        dataNascimento: '1995-05-15',
        observacoes: 'Aluna muito interessada',
        status: 'ativo',
        dataCriacao: '2024-01-01T10:00:00Z',
        dataAtualizacao: '2024-01-15T14:30:00Z'
      };

      // Mock do GetAlunoService.handle
      const originalHandle = GetAlunoService.handle;
      GetAlunoService.handle = async () => mockAluno;

      const controller = new GetAlunoController(mockReq, mockRes);
      await controller.execute();

      expect(mockRes.statusCode).toBe(200);
      expect(mockRes.data).toEqual(mockAluno);
      expect(mockRes.data.endereco).toBeDefined();
      expect(mockRes.data.dataNascimento).toBeDefined();
      expect(mockRes.data.observacoes).toBeDefined();

      // Restore original
      GetAlunoService.handle = originalHandle;
    });

    test('deve funcionar com aluno sem campos opcionais', async () => {
      const mockAluno = {
        id: 1,
        nome: 'João',
        sobrenome: 'Santos',
        email: 'joao@email.com',
        telefone: '11999888777'
      };

      // Mock do GetAlunoService.handle
      const originalHandle = GetAlunoService.handle;
      GetAlunoService.handle = async () => mockAluno;

      const controller = new GetAlunoController(mockReq, mockRes);
      await controller.execute();

      expect(mockRes.statusCode).toBe(200);
      expect(mockRes.data).toEqual(mockAluno);

      // Restore original
      GetAlunoService.handle = originalHandle;
    });
  });

  describe('Controle de acesso - Filtros por permissão', () => {
    test('deve passar where vazio quando usuário é admin', async () => {
      mockReq.user = {
        id: 'admin-123',
        isAdmin: true
      };

      const originalHandle = GetAlunoService.handle;
      let receivedWhere;
      GetAlunoService.handle = async (id, where) => {
        receivedWhere = where;
        return { id: '1', nome: 'Teste' };
      };

      const controller = new GetAlunoController(mockReq, mockRes);
      await controller.execute();

      expect(receivedWhere).toEqual({});

      GetAlunoService.handle = originalHandle;
    });

    test('deve passar filtro de aulas quando usuário não é admin', async () => {
      const professorId = 'professor-456';
      mockReq.user = {
        id: professorId,
        isAdmin: false
      };

      const originalHandle = GetAlunoService.handle;
      let receivedWhere;
      GetAlunoService.handle = async (id, where) => {
        receivedWhere = where;
        return { id: '1', nome: 'Teste' };
      };

      const controller = new GetAlunoController(mockReq, mockRes);
      await controller.execute();

      expect(receivedWhere).toEqual({
        aulas: {
          some: {
            idProfessor: professorId
          }
        }
      });

      GetAlunoService.handle = originalHandle;
    });

    test('deve retornar 404 se aluno não pertence ao professor', async () => {
      mockReq.user = {
        id: 'professor-999',
        isAdmin: false
      };

      const originalHandle = GetAlunoService.handle;
      GetAlunoService.handle = async () => null;

      const controller = new GetAlunoController(mockReq, mockRes);
      await controller.execute();

      expect(mockRes.statusCode).toBe(404);
      expect(mockRes.data).toEqual({
        message: 'Aluno não encontrado'
      });

      GetAlunoService.handle = originalHandle;
    });
  });
});
