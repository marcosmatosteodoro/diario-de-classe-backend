import { DeleteAlunoController } from '../../../../src/controllers/aluno/deleteAlunoController.js';
import { GetAlunoService } from '../../../../src/services/aluno/getAlunoService.js';
import { DeleteAlunoService } from '../../../../src/services/aluno/deleteAlunoService.js';
import AbstractController from '../../../../src/controllers/abstractController.js';

describe('DeleteAlunoController', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      validatedId: 'cq7k8j2l4m0n5o6p7q8r9s0t1u',
      params: { id: 'cq7k8j2l4m0n5o6p7q8r9s0t1u' },
      user: {
        id: 'admin-default',
        isAdmin: true
      },
      t: key => {
        const translations = {
          'alunos.get.not_found': 'Aluno não encontrado',
          'alunos.delete.error': 'Erro ao deletar aluno'
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
      const controller = new DeleteAlunoController(mockReq, mockRes);

      expect(controller).toBeInstanceOf(DeleteAlunoController);
      expect(controller.req).toBe(mockReq);
      expect(controller.res).toBe(mockRes);
    });

    test('deve herdar de AbstractController', () => {
      const controller = new DeleteAlunoController(mockReq, mockRes);
      expect(controller).toBeInstanceOf(AbstractController);
    });

    test('deve ter método execute implementado', () => {
      const controller = new DeleteAlunoController(mockReq, mockRes);
      expect(typeof controller.execute).toBe('function');
    });

    test('deve ter método estático handle', () => {
      expect(DeleteAlunoController.handle).toBeDefined();
      expect(typeof DeleteAlunoController.handle).toBe('function');
    });
  });

  describe('Estrutura da classe', () => {
    test('deve implementar os métodos obrigatórios', () => {
      const controller = new DeleteAlunoController(mockReq, mockRes);

      expect(typeof controller.execute).toBe('function');
      expect(typeof DeleteAlunoController.handle).toBe('function');
    });

    test('deve armazenar req e res corretamente', () => {
      const controller = new DeleteAlunoController(mockReq, mockRes);

      expect(controller.req).toBe(mockReq);
      expect(controller.res).toBe(mockRes);
    });

    test('deve chamar super no construtor', () => {
      const controller = new DeleteAlunoController(mockReq, mockRes);

      // Verifica se inherited properties estão disponíveis
      expect(controller.handleError).toBeDefined();
    });
  });

  describe('Método execute()', () => {
    test('deve existir e ser uma função assíncrona', () => {
      const controller = new DeleteAlunoController(mockReq, mockRes);

      expect(typeof controller.execute).toBe('function');
      expect(controller.execute.constructor.name).toBe('AsyncFunction');
    });

    test('deve usar ID validado quando disponível', async () => {
      mockReq.validatedId = '123';
      mockReq.params.id = '456';

      const originalGetHandle = GetAlunoService.handle;
      const originalDeleteHandle = DeleteAlunoService.handle;

      // Mock para verificar o ID recebido
      GetAlunoService.handle = async id => {
        expect(id).toBe('123');
        return { id: '123', nome: 'Teste' };
      };

      DeleteAlunoService.handle = async id => {
        expect(id).toBe('123');
      };

      const controller = new DeleteAlunoController(mockReq, mockRes);
      await controller.execute();

      // Restore originals
      GetAlunoService.handle = originalGetHandle;
      DeleteAlunoService.handle = originalDeleteHandle;
    });

    test('deve usar ID dos parâmetros quando validatedId não disponível', async () => {
      mockReq.validatedId = undefined;
      mockReq.params.id = '456';

      const originalGetHandle = GetAlunoService.handle;
      const originalDeleteHandle = DeleteAlunoService.handle;

      // Mock para verificar o ID recebido
      GetAlunoService.handle = async id => {
        expect(id).toBe('456');
        return { id: '456', nome: 'Teste' };
      };

      DeleteAlunoService.handle = async id => {
        expect(id).toBe('456');
      };

      const controller = new DeleteAlunoController(mockReq, mockRes);
      await controller.execute();

      // Restore originals
      GetAlunoService.handle = originalGetHandle;
      DeleteAlunoService.handle = originalDeleteHandle;
    });
  });

  describe('Execução com sucesso', () => {
    test('deve deletar aluno e retornar status 204', async () => {
      const originalGetHandle = GetAlunoService.handle;
      const originalDeleteHandle = DeleteAlunoService.handle;

      GetAlunoService.handle = async () => ({
        id: 'cq7k8j2l4m0n5o6p7q8r9s0t1u',
        nome: 'João',
        email: 'joao@email.com'
      });

      DeleteAlunoService.handle = async () => {};

      const controller = new DeleteAlunoController(mockReq, mockRes);
      await controller.execute();

      expect(mockRes.statusCode).toBe(204);
      expect(mockRes.data).toBeUndefined();

      GetAlunoService.handle = originalGetHandle;
      DeleteAlunoService.handle = originalDeleteHandle;
    });

    test('deve chamar GetAlunoService antes do DeleteAlunoService', async () => {
      const originalGetHandle = GetAlunoService.handle;
      const originalDeleteHandle = DeleteAlunoService.handle;

      let getServiceCalled = false;
      let deleteServiceCalled = false;
      const callOrder = [];

      GetAlunoService.handle = async () => {
        getServiceCalled = true;
        callOrder.push('get');
        return { id: '1', nome: 'Teste' };
      };

      DeleteAlunoService.handle = async () => {
        deleteServiceCalled = true;
        callOrder.push('delete');
      };

      const controller = new DeleteAlunoController(mockReq, mockRes);
      await controller.execute();

      expect(getServiceCalled).toBe(true);
      expect(deleteServiceCalled).toBe(true);
      expect(callOrder).toEqual(['get', 'delete']);

      GetAlunoService.handle = originalGetHandle;
      DeleteAlunoService.handle = originalDeleteHandle;
    });

    test('deve retornar resposta vazia com status 204', async () => {
      const originalGetHandle = GetAlunoService.handle;
      const originalDeleteHandle = DeleteAlunoService.handle;

      GetAlunoService.handle = async () => ({ id: '1', nome: 'Teste' });
      DeleteAlunoService.handle = async () => {};

      const controller = new DeleteAlunoController(mockReq, mockRes);
      await controller.execute();

      expect(mockRes.statusCode).toBe(204);
      expect(mockRes.data).toBeUndefined();

      GetAlunoService.handle = originalGetHandle;
      DeleteAlunoService.handle = originalDeleteHandle;
    });
  });

  describe('Aluno não encontrado', () => {
    test('deve retornar status 404 quando aluno não existe', async () => {
      const originalHandle = GetAlunoService.handle;
      GetAlunoService.handle = async () => null;

      const controller = new DeleteAlunoController(mockReq, mockRes);
      await controller.execute();

      expect(mockRes.statusCode).toBe(404);
      expect(mockRes.data).toEqual({
        message: 'Aluno não encontrado'
      });

      GetAlunoService.handle = originalHandle;
    });

    test('deve usar chave de tradução correta para not_found', async () => {
      let translationKey = '';
      mockReq.t = key => {
        translationKey = key;
        return 'Aluno não encontrado';
      };

      const originalHandle = GetAlunoService.handle;
      GetAlunoService.handle = async () => null;

      const controller = new DeleteAlunoController(mockReq, mockRes);
      await controller.execute();

      expect(translationKey).toBe('alunos.get.not_found');
      expect(mockRes.statusCode).toBe(404);

      GetAlunoService.handle = originalHandle;
    });

    test('deve não chamar DeleteAlunoService quando aluno não existe', async () => {
      const originalGetHandle = GetAlunoService.handle;
      const originalDeleteHandle = DeleteAlunoService.handle;

      let deleteServiceCalled = false;

      GetAlunoService.handle = async () => null;
      DeleteAlunoService.handle = async () => {
        deleteServiceCalled = true;
      };

      const controller = new DeleteAlunoController(mockReq, mockRes);
      await controller.execute();

      expect(deleteServiceCalled).toBe(false);
      expect(mockRes.statusCode).toBe(404);

      GetAlunoService.handle = originalGetHandle;
      DeleteAlunoService.handle = originalDeleteHandle;
    });
  });

  describe('Tratamento de erros', () => {
    test('deve tratar erro do GetAlunoService', async () => {
      const testError = new Error('Database error');
      const originalHandle = GetAlunoService.handle;

      GetAlunoService.handle = async () => {
        throw testError;
      };

      const controller = new DeleteAlunoController(mockReq, mockRes);

      let handledError;
      let handledTranslationKey;

      controller.handleError = (error, translationKey) => {
        handledError = error;
        handledTranslationKey = translationKey;
      };

      await controller.execute();

      expect(handledError).toBe(testError);
      expect(handledTranslationKey).toBe('alunos.delete.error');

      GetAlunoService.handle = originalHandle;
    });

    test('deve tratar erro do DeleteAlunoService', async () => {
      const testError = new Error('Delete error');
      const originalGetHandle = GetAlunoService.handle;
      const originalDeleteHandle = DeleteAlunoService.handle;

      GetAlunoService.handle = async () => ({ id: '1', nome: 'Teste' });
      DeleteAlunoService.handle = async () => {
        throw testError;
      };

      const controller = new DeleteAlunoController(mockReq, mockRes);

      let handledError;
      let handledTranslationKey;

      controller.handleError = (error, translationKey) => {
        handledError = error;
        handledTranslationKey = translationKey;
      };

      await controller.execute();

      expect(handledError).toBe(testError);
      expect(handledTranslationKey).toBe('alunos.delete.error');

      GetAlunoService.handle = originalGetHandle;
      DeleteAlunoService.handle = originalDeleteHandle;
    });

    test('deve usar chave de tradução correta para erro', async () => {
      const testError = new Error('Service error');
      const originalHandle = GetAlunoService.handle;

      GetAlunoService.handle = async () => {
        throw testError;
      };

      const controller = new DeleteAlunoController(mockReq, mockRes);

      let translationKey = '';
      controller.handleError = (error, key) => {
        translationKey = key;
      };

      await controller.execute();

      expect(translationKey).toBe('alunos.delete.error');

      GetAlunoService.handle = originalHandle;
    });
  });

  describe('Método estático handle()', () => {
    test('deve ser uma função estática', () => {
      expect(typeof DeleteAlunoController.handle).toBe('function');
      expect(DeleteAlunoController.handle).not.toBe(AbstractController.handle);
    });

    test('deve executar através do método estático', async () => {
      const originalGetHandle = GetAlunoService.handle;
      const originalDeleteHandle = DeleteAlunoService.handle;

      GetAlunoService.handle = async () => ({
        id: 'cq7k8j2l4m0n5o6p7q8r9s0t1u',
        nome: 'João',
        email: 'joao@email.com'
      });

      DeleteAlunoService.handle = async () => {};

      await DeleteAlunoController.handle(mockReq, mockRes);

      expect(mockRes.statusCode).toBe(204);

      GetAlunoService.handle = originalGetHandle;
      DeleteAlunoService.handle = originalDeleteHandle;
    });

    test('deve criar nova instância do controller a cada chamada', async () => {
      const originalGetHandle = GetAlunoService.handle;
      const originalDeleteHandle = DeleteAlunoService.handle;

      GetAlunoService.handle = async () => ({ id: 1, nome: 'Teste' });
      DeleteAlunoService.handle = async () => {};

      await DeleteAlunoController.handle(mockReq, mockRes);
      expect(mockRes.statusCode).toBe(204);

      // Segunda chamada deve funcionar independentemente
      mockRes.statusCode = null;
      await DeleteAlunoController.handle(mockReq, mockRes);
      expect(mockRes.statusCode).toBe(204);

      GetAlunoService.handle = originalGetHandle;
      DeleteAlunoService.handle = originalDeleteHandle;
    });
  });

  describe('Integração com AbstractController', () => {
    test('deve implementar método execute() abstrato', () => {
      const controller = new DeleteAlunoController(mockReq, mockRes);

      expect(controller.execute).toBeDefined();
      expect(controller.execute).not.toBe(AbstractController.prototype.execute);
    });

    test('deve ter acesso ao método handleError da classe pai', () => {
      const controller = new DeleteAlunoController(mockReq, mockRes);

      expect(controller.handleError).toBeDefined();
      expect(typeof controller.handleError).toBe('function');
    });

    test('deve ser uma subclasse de AbstractController através de AbstractAlunoController', () => {
      expect(DeleteAlunoController.prototype).toBeInstanceOf(Object);
      // DeleteAlunoController herda de AbstractAlunoController que herda de AbstractController
      const proto = Object.getPrototypeOf(DeleteAlunoController.prototype);
      expect(proto.constructor.name).toBe('AbstractAlunoController');
      expect(Object.getPrototypeOf(proto)).toBe(AbstractController.prototype);
    });

    test('deve implementar método handle() estático', () => {
      expect(typeof DeleteAlunoController.handle).toBe('function');
      expect(DeleteAlunoController.handle).not.toBe(AbstractController.handle);
    });
  });

  describe('Validação de parâmetros', () => {
    test('deve funcionar com diferentes IDs', async () => {
      const testCases = ['1', '123', 'abc'];
      const originalGetHandle = GetAlunoService.handle;
      const originalDeleteHandle = DeleteAlunoService.handle;

      const receivedIds = [];

      GetAlunoService.handle = async id => {
        receivedIds.push(id);
        return { id, nome: 'Teste' };
      };

      DeleteAlunoService.handle = async () => {};

      for (const testId of testCases) {
        mockReq.params.id = testId;
        mockReq.validatedId = undefined;
        const controller = new DeleteAlunoController(mockReq, mockRes);
        await controller.execute();
      }

      expect(receivedIds).toEqual(testCases);

      GetAlunoService.handle = originalGetHandle;
      DeleteAlunoService.handle = originalDeleteHandle;
    });

    test('deve priorizar validatedId sobre params.id', async () => {
      const validatedId = 'validated-123';
      const paramsId = 'params-456';

      mockReq.validatedId = validatedId;
      mockReq.params.id = paramsId;

      const originalGetHandle = GetAlunoService.handle;
      const originalDeleteHandle = DeleteAlunoService.handle;

      let receivedId = null;

      GetAlunoService.handle = async id => {
        receivedId = id;
        return { id, nome: 'Teste' };
      };

      DeleteAlunoService.handle = async () => {};

      const controller = new DeleteAlunoController(mockReq, mockRes);
      await controller.execute();

      expect(receivedId).toBe(validatedId);

      GetAlunoService.handle = originalGetHandle;
      DeleteAlunoService.handle = originalDeleteHandle;
    });
  });

  describe('Cenários específicos do Aluno', () => {
    test('deve deletar aluno com campos específicos', async () => {
      const mockAluno = {
        id: 1,
        nome: 'Maria',
        sobrenome: 'Silva',
        email: 'maria@email.com',
        telefone: '11988887777',
        endereco: 'Av. Principal, 456',
        dataNascimento: '1995-05-15',
        observacoes: 'Aluna muito interessada'
      };

      const originalGetHandle = GetAlunoService.handle;
      const originalDeleteHandle = DeleteAlunoService.handle;

      GetAlunoService.handle = async () => mockAluno;
      DeleteAlunoService.handle = async () => {};

      const controller = new DeleteAlunoController(mockReq, mockRes);
      await controller.execute();

      expect(mockRes.statusCode).toBe(204);

      GetAlunoService.handle = originalGetHandle;
      DeleteAlunoService.handle = originalDeleteHandle;
    });

    test('deve funcionar com aluno sem campos opcionais', async () => {
      const mockAluno = {
        id: 1,
        nome: 'João',
        sobrenome: 'Santos',
        email: 'joao@email.com',
        telefone: '11999888777'
      };

      const originalGetHandle = GetAlunoService.handle;
      const originalDeleteHandle = DeleteAlunoService.handle;

      GetAlunoService.handle = async () => mockAluno;
      DeleteAlunoService.handle = async () => {};

      const controller = new DeleteAlunoController(mockReq, mockRes);
      await controller.execute();

      expect(mockRes.statusCode).toBe(204);

      GetAlunoService.handle = originalGetHandle;
      DeleteAlunoService.handle = originalDeleteHandle;
    });
  });

  describe('Controle de acesso - Filtros por permissão', () => {
    test('deve passar where vazio quando usuário é admin', async () => {
      mockReq.user = {
        id: 'admin-123',
        isAdmin: true
      };

      const originalGetHandle = GetAlunoService.handle;
      const originalDeleteHandle = DeleteAlunoService.handle;

      let receivedWhere;
      GetAlunoService.handle = async (id, where) => {
        receivedWhere = where;
        return { id: '1', nome: 'Teste' };
      };
      DeleteAlunoService.handle = async () => {};

      const controller = new DeleteAlunoController(mockReq, mockRes);
      await controller.execute();

      expect(receivedWhere).toEqual({});

      GetAlunoService.handle = originalGetHandle;
      DeleteAlunoService.handle = originalDeleteHandle;
    });

    test('deve passar filtro de aulas quando usuário não é admin', async () => {
      const professorId = 'professor-456';
      mockReq.user = {
        id: professorId,
        isAdmin: false
      };

      const originalGetHandle = GetAlunoService.handle;
      const originalDeleteHandle = DeleteAlunoService.handle;

      let receivedWhere;
      GetAlunoService.handle = async (id, where) => {
        receivedWhere = where;
        return { id: '1', nome: 'Teste' };
      };
      DeleteAlunoService.handle = async () => {};

      const controller = new DeleteAlunoController(mockReq, mockRes);
      await controller.execute();

      expect(receivedWhere).toEqual({
        OR: [
          {
            aulas: {
              some: {
                idProfessor: professorId
              }
            }
          },
          {
            criador: professorId
          }
        ]
      });

      GetAlunoService.handle = originalGetHandle;
      DeleteAlunoService.handle = originalDeleteHandle;
    });

    test('deve retornar 404 se aluno não pertence ao professor', async () => {
      mockReq.user = {
        id: 'professor-999',
        isAdmin: false
      };

      const originalGetHandle = GetAlunoService.handle;
      GetAlunoService.handle = async () => null;

      const controller = new DeleteAlunoController(mockReq, mockRes);
      await controller.execute();

      expect(mockRes.statusCode).toBe(404);
      expect(mockRes.data).toEqual({
        message: 'Aluno não encontrado'
      });

      GetAlunoService.handle = originalGetHandle;
    });

    test('não deve deletar aluno que não pertence ao professor', async () => {
      mockReq.user = {
        id: 'professor-888',
        isAdmin: false
      };

      const originalGetHandle = GetAlunoService.handle;
      const originalDeleteHandle = DeleteAlunoService.handle;

      let deleteWasCalled = false;
      GetAlunoService.handle = async () => null;
      DeleteAlunoService.handle = async () => {
        deleteWasCalled = true;
      };

      const controller = new DeleteAlunoController(mockReq, mockRes);
      await controller.execute();

      expect(deleteWasCalled).toBe(false);
      expect(mockRes.statusCode).toBe(404);

      GetAlunoService.handle = originalGetHandle;
      DeleteAlunoService.handle = originalDeleteHandle;
    });
  });
});
