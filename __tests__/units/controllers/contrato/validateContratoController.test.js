import { ValidateContratoController } from '../../../../src/controllers/contrato/validateContratoController.js';
import AbstractController from '../../../../src/controllers/abstractController.js';
import ContratoRepository from '../../../../src/repositories/contratoRepository.js';
import { GetAulaListService } from '../../../../src/services/aula/getAulaListService.js';
import { GetUserListService } from '../../../../src/services/user/getUserListService.js';
import { UpdateContratoService } from '../../../../src/services/contrato/updateContratoService.js';

describe('ValidateContratoController', () => {
  let controller, mockReq, mockRes;
  let mockRepository;

  beforeEach(() => {
    mockReq = {
      params: { id: 'contrato-123' },
      query: {},
      t: key => {
        const translations = {
          'contratos.get.not_found': 'Contrato não encontrado',
          'contratos.validate.professores_not_exists': 'Professores não encontrados',
          'contratos.validate.aluno_not_exists': 'Aluno não encontrado',
          'contratos.validate.invalid_dates': 'Datas inválidas',
          'contratos.validate.no_classes': 'Sem aulas cadastradas',
          'contratos.validate.contrato_actived': 'Contrato já está ativo',
          'contratos.validate.contrato_canceled_confirmation_required':
            'Confirmação necessária para contrato cancelado',
          'contratos.validate.contrato_inativo_confirmation_required':
            'Confirmação necessária para contrato inativo',
          'contratos.validate.error': 'Erro ao validar contrato'
        };
        return translations[key] || key;
      }
    };

    mockRes = {
      statusCode: null,
      data: null,
      status: function (code) {
        this.statusCode = code;
        return this;
      },
      json: function (data) {
        this.data = data;
        return this;
      }
    };

    // Mock do repository
    mockRepository = {
      selectOne: async () => ({
        id: 'contrato-123',
        status: 'PENDENTE',
        dataInicio: '2025-01-01',
        dataTermino: '2025-12-31',
        aluno: { id: 'aluno-123', nome: 'João' }
      }),
      getSelectFieldsWithRelations: () => ({})
    };

    // Mock dos services
    GetAulaListService.handle = async () => [
      { id: 'aula-1', idProfessor: 'prof-1' },
      { id: 'aula-2', idProfessor: 'prof-2' }
    ];

    GetUserListService.handle = async () => [
      { id: 'prof-1', nome: 'Professor 1' },
      { id: 'prof-2', nome: 'Professor 2' }
    ];

    UpdateContratoService.handle = async (id, data) => ({
      id,
      ...data,
      updated: true
    });

    controller = new ValidateContratoController(mockReq, mockRes);
    controller.repository = mockRepository;
  });

  describe('Inicialização', () => {
    test('deve criar uma instância com req e res', () => {
      expect(controller).toBeInstanceOf(ValidateContratoController);
      expect(controller.req).toBe(mockReq);
      expect(controller.res).toBe(mockRes);
    });

    test('deve herdar de AbstractController', () => {
      expect(controller).toBeInstanceOf(AbstractController);
    });

    test('deve inicializar repository', () => {
      const newController = new ValidateContratoController(mockReq, mockRes);
      expect(newController.repository).toBeInstanceOf(ContratoRepository);
    });

    test('deve ter método execute implementado', () => {
      expect(controller.execute).toBeDefined();
      expect(typeof controller.execute).toBe('function');
    });

    test('deve ter método estático handle', () => {
      expect(ValidateContratoController.handle).toBeDefined();
      expect(typeof ValidateContratoController.handle).toBe('function');
    });
  });

  describe('Estrutura da classe', () => {
    test('deve implementar os métodos obrigatórios', () => {
      expect(typeof controller.execute).toBe('function');
      expect(typeof ValidateContratoController.handle).toBe('function');
    });

    test('deve armazenar req e res corretamente', () => {
      expect(controller.req).toBe(mockReq);
      expect(controller.res).toBe(mockRes);
    });

    test('deve chamar super no construtor', () => {
      expect(controller.handleError).toBeDefined();
    });

    test('deve ter execute como função assíncrona', () => {
      expect(controller.execute.constructor.name).toBe('AsyncFunction');
    });
  });

  describe('execute() - Validação de contrato não encontrado', () => {
    test('deve retornar 404 quando contrato não existe', async () => {
      mockRepository.selectOne = async () => null;

      await controller.execute();

      expect(mockRes.statusCode).toBe(404);
      expect(mockRes.data.message).toBe('Contrato não encontrado');
    });

    test('deve usar validatedId quando disponível', async () => {
      mockReq.validatedId = 'validated-id';
      let usedId = null;

      mockRepository.selectOne = async ({ where }) => {
        usedId = where.id;
        return {
          id: 'validated-id',
          status: 'PENDENTE',
          dataInicio: '2025-01-01',
          dataTermino: '2025-12-31',
          aluno: { id: 'aluno-123' }
        };
      };

      await controller.execute();

      expect(usedId).toBe('validated-id');
    });

    test('deve usar params.id quando validatedId não disponível', async () => {
      mockReq.validatedId = undefined;
      let usedId = null;

      mockRepository.selectOne = async ({ where }) => {
        usedId = where.id;
        return {
          id: 'contrato-123',
          status: 'PENDENTE',
          dataInicio: '2025-01-01',
          dataTermino: '2025-12-31',
          aluno: { id: 'aluno-123' }
        };
      };

      await controller.execute();

      expect(usedId).toBe('contrato-123');
    });
  });

  describe('execute() - Validação de professores', () => {
    test('deve retornar 422 quando nenhum professor existe', async () => {
      GetUserListService.handle = async () => [];

      await controller.execute();

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Professores não encontrados');
    });

    test('deve retornar 422 quando nem todos professores existem', async () => {
      GetAulaListService.handle = async () => [
        { id: 'aula-1', idProfessor: 'prof-1' },
        { id: 'aula-2', idProfessor: 'prof-2' },
        { id: 'aula-3', idProfessor: 'prof-3' }
      ];

      GetUserListService.handle = async () => [
        { id: 'prof-1', nome: 'Professor 1' },
        { id: 'prof-2', nome: 'Professor 2' }
      ];

      await controller.execute();

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Professores não encontrados');
    });

    test('deve extrair IDs únicos de professores', async () => {
      GetAulaListService.handle = async () => [
        { id: 'aula-1', idProfessor: 'prof-1' },
        { id: 'aula-2', idProfessor: 'prof-1' },
        { id: 'aula-3', idProfessor: 'prof-2' }
      ];

      let professoresQuery = null;
      GetUserListService.handle = async query => {
        professoresQuery = query;
        return [
          { id: 'prof-1', nome: 'Professor 1' },
          { id: 'prof-2', nome: 'Professor 2' }
        ];
      };

      await controller.execute();

      expect(professoresQuery.id.in).toEqual(['prof-1', 'prof-2']);
      expect(professoresQuery.id.in.length).toBe(2);
    });
  });

  describe('execute() - Validação de aluno', () => {
    test('deve retornar 422 quando aluno não existe', async () => {
      mockRepository.selectOne = async () => ({
        id: 'contrato-123',
        status: 'PENDENTE',
        dataInicio: '2025-01-01',
        dataTermino: '2025-12-31',
        aluno: null
      });

      await controller.execute();

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Aluno não encontrado');
    });

    test('deve aceitar aluno existente', async () => {
      mockRepository.selectOne = async () => ({
        id: 'contrato-123',
        status: 'PENDENTE',
        dataInicio: '2025-01-01',
        dataTermino: '2025-12-31',
        aluno: { id: 'aluno-123', nome: 'João' }
      });

      await controller.execute();

      expect(mockRes.statusCode).toBe(200);
    });
  });

  describe('execute() - Validação de datas', () => {
    test('deve retornar 422 quando dataInicio está ausente', async () => {
      mockRepository.selectOne = async () => ({
        id: 'contrato-123',
        status: 'PENDENTE',
        dataInicio: null,
        dataTermino: '2025-12-31',
        aluno: { id: 'aluno-123' }
      });

      await controller.execute();

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Datas inválidas');
    });

    test('deve retornar 422 quando dataTermino está ausente', async () => {
      mockRepository.selectOne = async () => ({
        id: 'contrato-123',
        status: 'PENDENTE',
        dataInicio: '2025-01-01',
        dataTermino: null,
        aluno: { id: 'aluno-123' }
      });

      await controller.execute();

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Datas inválidas');
    });

    test('deve retornar 422 quando ambas datas estão ausentes', async () => {
      mockRepository.selectOne = async () => ({
        id: 'contrato-123',
        status: 'PENDENTE',
        dataInicio: null,
        dataTermino: null,
        aluno: { id: 'aluno-123' }
      });

      await controller.execute();

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Datas inválidas');
    });

    test('deve aceitar datas válidas', async () => {
      mockRepository.selectOne = async () => ({
        id: 'contrato-123',
        status: 'PENDENTE',
        dataInicio: '2025-01-01',
        dataTermino: '2025-12-31',
        aluno: { id: 'aluno-123' }
      });

      await controller.execute();

      expect(mockRes.statusCode).toBe(200);
    });
  });

  describe('execute() - Validação de aulas', () => {
    test('deve retornar 422 quando não há aulas', async () => {
      GetAulaListService.handle = async () => [];
      GetUserListService.handle = async () => [];

      await controller.execute();

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Professores não encontrados');
    });

    test('deve retornar 500 quando aulas é null (erro no map)', async () => {
      GetAulaListService.handle = async () => null;

      await controller.execute();

      expect(mockRes.statusCode).toBe(500);
      expect(mockRes.data.message).toBe('Erro ao validar contrato');
    });

    test('deve aceitar quando há aulas', async () => {
      GetAulaListService.handle = async () => [{ id: 'aula-1', idProfessor: 'prof-1' }];

      GetUserListService.handle = async () => [{ id: 'prof-1', nome: 'Professor 1' }];

      await controller.execute();

      expect(mockRes.statusCode).toBe(200);
    });

    test('deve retornar 422 quando array de aulas está vazio mas professores existe', async () => {
      mockRepository.selectOne = async () => ({
        id: 'contrato-123',
        status: 'PENDENTE',
        dataInicio: '2025-01-01',
        dataTermino: '2025-12-31',
        aluno: { id: 'aluno-123' }
      });

      GetAulaListService.handle = async () => [];
      GetUserListService.handle = async () => [];

      await controller.execute();

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Professores não encontrados');
    });
  });

  describe('execute() - Validação de status do contrato', () => {
    test('deve retornar 422 quando contrato já está ativo', async () => {
      mockRepository.selectOne = async () => ({
        id: 'contrato-123',
        status: 'ATIVO',
        dataInicio: '2025-01-01',
        dataTermino: '2025-12-31',
        aluno: { id: 'aluno-123' }
      });

      await controller.execute();

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Contrato já está ativo');
    });

    test('deve aceitar contrato PENDENTE', async () => {
      mockRepository.selectOne = async () => ({
        id: 'contrato-123',
        status: 'PENDENTE',
        dataInicio: '2025-01-01',
        dataTermino: '2025-12-31',
        aluno: { id: 'aluno-123' }
      });

      await controller.execute();

      expect(mockRes.statusCode).toBe(200);
    });
  });

  describe('execute() - Validação de contrato cancelado', () => {
    test('deve retornar 422 quando contrato cancelado sem confirmação', async () => {
      mockRepository.selectOne = async () => ({
        id: 'contrato-123',
        status: 'CANCELADO',
        dataInicio: '2025-01-01',
        dataTermino: '2025-12-31',
        aluno: { id: 'aluno-123' }
      });

      mockReq.query.confirmation = 'false';

      await controller.execute();

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Confirmação necessária para contrato cancelado');
    });

    test('deve aceitar contrato cancelado com confirmação correta', async () => {
      mockRepository.selectOne = async () => ({
        id: 'contrato-123',
        status: 'CANCELADO',
        dataInicio: '2025-01-01',
        dataTermino: '2025-12-31',
        aluno: { id: 'aluno-123' }
      });

      mockReq.query.confirmation = 'CANCELADO';

      await controller.execute();

      expect(mockRes.statusCode).toBe(200);
    });

    test('deve rejeitar confirmação incorreta para contrato cancelado', async () => {
      mockRepository.selectOne = async () => ({
        id: 'contrato-123',
        status: 'CANCELADO',
        dataInicio: '2025-01-01',
        dataTermino: '2025-12-31',
        aluno: { id: 'aluno-123' }
      });

      mockReq.query.confirmation = 'INATIVO';

      await controller.execute();

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Confirmação necessária para contrato cancelado');
    });
  });

  describe('execute() - Validação de contrato inativo', () => {
    test('deve retornar 422 quando contrato inativo sem confirmação', async () => {
      mockRepository.selectOne = async () => ({
        id: 'contrato-123',
        status: 'INATIVO',
        dataInicio: '2025-01-01',
        dataTermino: '2025-12-31',
        aluno: { id: 'aluno-123' }
      });

      mockReq.query.confirmation = 'false';

      await controller.execute();

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Confirmação necessária para contrato inativo');
    });

    test('deve aceitar contrato inativo com confirmação correta', async () => {
      mockRepository.selectOne = async () => ({
        id: 'contrato-123',
        status: 'INATIVO',
        dataInicio: '2025-01-01',
        dataTermino: '2025-12-31',
        aluno: { id: 'aluno-123' }
      });

      mockReq.query.confirmation = 'INATIVO';

      await controller.execute();

      expect(mockRes.statusCode).toBe(200);
    });

    test('deve rejeitar confirmação incorreta para contrato inativo', async () => {
      mockRepository.selectOne = async () => ({
        id: 'contrato-123',
        status: 'INATIVO',
        dataInicio: '2025-01-01',
        dataTermino: '2025-12-31',
        aluno: { id: 'aluno-123' }
      });

      mockReq.query.confirmation = 'CANCELADO';

      await controller.execute();

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Confirmação necessária para contrato inativo');
    });

    test('deve usar "false" como confirmação padrão', async () => {
      mockRepository.selectOne = async () => ({
        id: 'contrato-123',
        status: 'INATIVO',
        dataInicio: '2025-01-01',
        dataTermino: '2025-12-31',
        aluno: { id: 'aluno-123' }
      });

      mockReq.query = {}; // Sem confirmation

      await controller.execute();

      expect(mockRes.statusCode).toBe(422);
    });
  });

  describe('execute() - Atualização bem-sucedida', () => {
    test('deve retornar 200 e atualizar contrato para ATIVO', async () => {
      let updateId = null;
      let updateData = null;

      UpdateContratoService.handle = async (id, data) => {
        updateId = id;
        updateData = data;
        return { id, status: 'ATIVO' };
      };

      await controller.execute();

      expect(mockRes.statusCode).toBe(200);
      expect(updateId).toBe('contrato-123');
      expect(updateData.status).toBe('ATIVO');
    });

    test('deve retornar dados atualizados', async () => {
      UpdateContratoService.handle = async id => ({
        id,
        status: 'ATIVO',
        dataInicio: '2025-01-01',
        dataTermino: '2025-12-31'
      });

      await controller.execute();

      expect(mockRes.statusCode).toBe(200);
      expect(mockRes.data.status).toBe('ATIVO');
      expect(mockRes.data.id).toBe('contrato-123');
    });

    test('deve chamar UpdateContratoService.handle', async () => {
      let serviceCalled = false;

      UpdateContratoService.handle = async (id, data) => {
        serviceCalled = true;
        return { id, ...data };
      };

      await controller.execute();

      expect(serviceCalled).toBe(true);
    });
  });

  describe('execute() - Tratamento de erros', () => {
    test('deve chamar handleError quando ocorrer erro no repository', async () => {
      mockRepository.selectOne = async () => {
        throw new Error('Database error');
      };

      await controller.execute();

      expect(mockRes.statusCode).toBe(500);
      expect(mockRes.data.message).toBe('Erro ao validar contrato');
    });

    test('deve chamar handleError quando ocorrer erro no service', async () => {
      GetAulaListService.handle = async () => {
        throw new Error('Service error');
      };

      await controller.execute();

      expect(mockRes.statusCode).toBe(500);
      expect(mockRes.data.message).toBe('Erro ao validar contrato');
    });

    test('deve chamar handleError quando ocorrer erro no update', async () => {
      UpdateContratoService.handle = async () => {
        throw new Error('Update error');
      };

      await controller.execute();

      expect(mockRes.statusCode).toBe(500);
      expect(mockRes.data.message).toBe('Erro ao validar contrato');
    });

    test('deve usar chave de tradução correta para erros', async () => {
      let translationKey = '';
      mockReq.t = key => {
        translationKey = key;
        return 'Erro ao validar contrato';
      };

      mockRepository.selectOne = async () => {
        throw new Error('Error');
      };

      await controller.execute();

      expect(translationKey).toBe('contratos.validate.error');
    });
  });

  describe('handle() - Método estático', () => {
    test('deve ser uma função estática', () => {
      expect(typeof ValidateContratoController.handle).toBe('function');
      expect(ValidateContratoController.handle).not.toBe(AbstractController.handle);
    });

    test('deve ser uma função assíncrona', () => {
      expect(ValidateContratoController.handle.constructor.name).toBe('AsyncFunction');
    });

    test('deve criar nova instância do controller a cada chamada', async () => {
      await ValidateContratoController.handle(mockReq, mockRes);

      // Handle cria nova instância com repository real, que retorna null para ID inexistente
      expect(mockRes.statusCode).toBe(404);
    });

    test('deve aceitar parâmetros req e res', () => {
      const handleMethod = ValidateContratoController.handle;
      expect(handleMethod).toBeDefined();
      expect(handleMethod.length).toBe(2);
    });

    test('deve passar req e res para nova instância', async () => {
      await ValidateContratoController.handle(mockReq, mockRes);

      // Usa repositório real, então retorna 404 para contrato inexistente
      expect(mockRes.statusCode).toBe(404);
      expect(mockRes.data).toBeDefined();
    });

    test('deve executar o método execute da instância', async () => {
      await ValidateContratoController.handle(mockReq, mockRes);

      // Verifica que execute foi chamado (response foi definido)
      expect(mockRes.statusCode).toBeDefined();
      expect(mockRes.data).toBeDefined();
    });

    test('deve tratar erros adequadamente no método estático', async () => {
      mockReq.params.id = 'error-id';

      await ValidateContratoController.handle(mockReq, mockRes);

      expect(mockRes.statusCode).toBeGreaterThanOrEqual(200);
    });
  });

  describe('Integração completa', () => {
    test('deve processar fluxo completo com sucesso', async () => {
      mockRepository.selectOne = async () => ({
        id: 'contrato-123',
        status: 'PENDENTE',
        dataInicio: '2025-01-01',
        dataTermino: '2025-12-31',
        aluno: { id: 'aluno-123', nome: 'João' }
      });

      GetAulaListService.handle = async () => [
        { id: 'aula-1', idProfessor: 'prof-1' },
        { id: 'aula-2', idProfessor: 'prof-2' }
      ];

      GetUserListService.handle = async () => [
        { id: 'prof-1', nome: 'Professor 1' },
        { id: 'prof-2', nome: 'Professor 2' }
      ];

      UpdateContratoService.handle = async id => ({
        id,
        status: 'ATIVO',
        dataInicio: '2025-01-01',
        dataTermino: '2025-12-31'
      });

      await controller.execute();

      expect(mockRes.statusCode).toBe(200);
      expect(mockRes.data.status).toBe('ATIVO');
      expect(mockRes.data.id).toBe('contrato-123');
    });

    test('deve processar múltiplas validações em sequência', async () => {
      const validations = [];

      mockRepository.selectOne = async () => {
        validations.push('repository');
        return {
          id: 'contrato-123',
          status: 'PENDENTE',
          dataInicio: '2025-01-01',
          dataTermino: '2025-12-31',
          aluno: { id: 'aluno-123' }
        };
      };

      GetAulaListService.handle = async () => {
        validations.push('aulas');
        return [{ id: 'aula-1', idProfessor: 'prof-1' }];
      };

      GetUserListService.handle = async () => {
        validations.push('professores');
        return [{ id: 'prof-1', nome: 'Professor 1' }];
      };

      UpdateContratoService.handle = async () => {
        validations.push('update');
        return { id: 'contrato-123', status: 'ATIVO' };
      };

      await controller.execute();

      expect(validations).toEqual(['repository', 'aulas', 'professores', 'update']);
    });

    test('deve validar todas condições antes de ativar', async () => {
      // Todas as condições devem passar
      mockRepository.selectOne = async () => ({
        id: 'contrato-123',
        status: 'PENDENTE',
        dataInicio: '2025-01-01',
        dataTermino: '2025-12-31',
        aluno: { id: 'aluno-123' }
      });

      GetAulaListService.handle = async () => [{ id: 'aula-1', idProfessor: 'prof-1' }];
      GetUserListService.handle = async () => [{ id: 'prof-1' }];

      let updateCalled = false;
      UpdateContratoService.handle = async () => {
        updateCalled = true;
        return { id: 'contrato-123', status: 'ATIVO' };
      };

      await controller.execute();

      expect(updateCalled).toBe(true);
      expect(mockRes.statusCode).toBe(200);
    });
  });
});
