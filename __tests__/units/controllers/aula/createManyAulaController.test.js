import { CreateManyAulaController } from '../../../../src/controllers/aula/createManyAulaController.js';
import { CreateAulaService } from '../../../../src/services/aula/createAulaService.js';
import { GetAlunoService } from '../../../../src/services/aluno/getAlunoService.js';
import { GetContratoService } from '../../../../src/services/contrato/getContratoService.js';
import { GetUserService } from '../../../../src/services/user/getUserService.js';
import { GetAulaListService } from '../../../../src/services/aula/getAulaListService.js';
import { DeleteAulaService } from '../../../../src/services/aula/deleteAulaService.js';
import { UpdateAulaService } from '../../../../src/services/aula/updateAulaService.js';
import AbstractController from '../../../../src/controllers/abstractController.js';

describe('CreateManyAulaController', () => {
  let controller, mockReq, mockRes;
  let originalGetAlunoHandle,
    originalGetContratoHandle,
    originalGetUserHandle,
    originalGetAulaListHandle,
    originalCreateAulaHandle,
    originalUpdateAulaHandle,
    originalDeleteAulaHandle;

  beforeEach(() => {
    mockReq = {
      params: { id: 'contrato-123' },
      validatedId: 'contrato-123',
      body: {
        idAluno: 'aluno-123',
        idProfessor: 'professor-123',
        aulas: [
          {
            dataAula: '2025-01-10',
            horaInicial: '08:00',
            horaFinal: '10:00',
            tipo: 'REGULAR',
            observacao: 'Aula 1'
          },
          {
            dataAula: '2025-01-15',
            horaInicial: '14:00',
            horaFinal: '16:00',
            tipo: 'REGULAR',
            observacao: 'Aula 2'
          }
        ]
      },
      t: key => {
        const translations = {
          'diaAulas.error.aluno_not_exists': 'Aluno não encontrado',
          'diaAulas.error.contrato_not_exists': 'Contrato não encontrado',
          'aulas.error.professor_not_exists': 'Professor não encontrado',
          'aulas.create.error': 'Erro ao criar aula'
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

    // Salvar implementações originais
    originalGetAlunoHandle = GetAlunoService.handle;
    originalGetContratoHandle = GetContratoService.handle;
    originalGetUserHandle = GetUserService.handle;
    originalGetAulaListHandle = GetAulaListService.handle;
    originalCreateAulaHandle = CreateAulaService.handle;
    originalUpdateAulaHandle = UpdateAulaService.handle;
    originalDeleteAulaHandle = DeleteAulaService.handle;

    // Mocks padrão
    GetAlunoService.handle = async () => ({ id: 'aluno-123', nome: 'Test Aluno' });
    GetContratoService.handle = async () => ({ id: 'contrato-123' });
    GetUserService.handle = async () => ({ id: 'professor-123', nome: 'Test Professor' });
    GetAulaListService.handle = async () => [];
    CreateAulaService.handle = async data => ({ id: 'new-aula', ...data });
    UpdateAulaService.handle = async data => ({ ...data });
    DeleteAulaService.handle = async () => true;

    controller = new CreateManyAulaController(mockReq, mockRes);
  });

  afterEach(() => {
    // Restaurar implementações originais
    GetAlunoService.handle = originalGetAlunoHandle;
    GetContratoService.handle = originalGetContratoHandle;
    GetUserService.handle = originalGetUserHandle;
    GetAulaListService.handle = originalGetAulaListHandle;
    CreateAulaService.handle = originalCreateAulaHandle;
    UpdateAulaService.handle = originalUpdateAulaHandle;
    DeleteAulaService.handle = originalDeleteAulaHandle;
  });

  describe('Inicialização', () => {
    test('deve herdar de AbstractController', () => {
      expect(controller).toBeInstanceOf(AbstractController);
    });

    test('deve criar uma instância com req e res', () => {
      expect(controller).toBeInstanceOf(CreateManyAulaController);
      expect(controller.req).toBe(mockReq);
      expect(controller.res).toBe(mockRes);
    });

    test('deve inicializar aulasData como array vazio', () => {
      expect(controller.aulasData).toEqual([]);
      expect(Array.isArray(controller.aulasData)).toBe(true);
    });

    test('deve ter acesso ao req e res', () => {
      expect(controller.req).toBe(mockReq);
      expect(controller.res).toBe(mockRes);
    });
  });

  describe('Métodos e estrutura', () => {
    test('deve ter método execute', () => {
      expect(typeof controller.execute).toBe('function');
    });

    test('deve ter método handle estático', () => {
      expect(typeof CreateManyAulaController.handle).toBe('function');
    });

    test('deve ter método isAlunoExists', () => {
      expect(typeof controller.isAlunoExists).toBe('function');
    });

    test('deve ter método isContratoExists', () => {
      expect(typeof controller.isContratoExists).toBe('function');
    });

    test('deve ter método isProfessorExists', () => {
      expect(typeof controller.isProfessorExists).toBe('function');
    });

    test('deve ter método aulaPrepareData', () => {
      expect(typeof controller.aulaPrepareData).toBe('function');
    });

    test('deve ter método sortAulasByDate', () => {
      expect(typeof controller.sortAulasByDate).toBe('function');
    });

    test('deve ter método execute como função assíncrona', () => {
      expect(controller.execute.constructor.name).toBe('AsyncFunction');
    });
  });

  describe('isAlunoExists', () => {
    test('deve retornar true quando aluno existe', async () => {
      GetAlunoService.handle = async () => ({ id: 'aluno-123' });
      const result = await controller.isAlunoExists('aluno-123');
      expect(result).toBe(true);
    });

    test('deve retornar false quando aluno não existe', async () => {
      GetAlunoService.handle = async () => null;
      const result = await controller.isAlunoExists('aluno-123');
      expect(result).toBe(false);
    });

    test('deve chamar GetAlunoService.handle com ID correto', async () => {
      let calledWith = null;
      GetAlunoService.handle = async id => {
        calledWith = id;
        return { id };
      };
      await controller.isAlunoExists('test-id');
      expect(calledWith).toBe('test-id');
    });
  });

  describe('isContratoExists', () => {
    test('deve retornar true quando contrato existe', async () => {
      GetContratoService.handle = async () => ({ id: 'contrato-123' });
      const result = await controller.isContratoExists('contrato-123');
      expect(result).toBe(true);
    });

    test('deve retornar false quando contrato não existe', async () => {
      GetContratoService.handle = async () => null;
      const result = await controller.isContratoExists('contrato-123');
      expect(result).toBe(false);
    });

    test('deve chamar GetContratoService.handle com ID correto', async () => {
      let calledWith = null;
      GetContratoService.handle = async id => {
        calledWith = id;
        return { id };
      };
      await controller.isContratoExists('test-id');
      expect(calledWith).toBe('test-id');
    });
  });

  describe('isProfessorExists', () => {
    test('deve retornar true quando professor existe', async () => {
      GetUserService.handle = async () => ({ id: 'professor-123' });
      const result = await controller.isProfessorExists('professor-123');
      expect(result).toBe(true);
    });

    test('deve retornar false quando professor não existe', async () => {
      GetUserService.handle = async () => null;
      const result = await controller.isProfessorExists('professor-123');
      expect(result).toBe(false);
    });

    test('deve chamar GetUserService.handle com ID correto', async () => {
      let calledWith = null;
      GetUserService.handle = async id => {
        calledWith = id;
        return { id };
      };
      await controller.isProfessorExists('test-id');
      expect(calledWith).toBe('test-id');
    });
  });

  describe('aulaPrepareData', () => {
    test('deve preparar dados da aula corretamente', () => {
      const input = {
        idAluno: 'aluno-123',
        idProfessor: 'prof-123',
        idContrato: 'contrato-123',
        aula: {
          dataAula: '2025-01-10',
          horaInicial: '08:00',
          horaFinal: '10:00',
          tipo: 'REGULAR',
          observacao: 'Teste'
        }
      };

      const result = controller.aulaPrepareData(input);

      expect(result).toEqual({
        idAluno: 'aluno-123',
        idProfessor: 'prof-123',
        idContrato: 'contrato-123',
        dataAula: '2025-01-10',
        horaInicial: '08:00',
        horaFinal: '10:00',
        tipo: 'REGULAR',
        status: 'AGENDADA',
        observacao: 'Teste'
      });
    });

    test('deve sempre definir status como AGENDADA', () => {
      const input = {
        idAluno: 'aluno-123',
        idProfessor: 'prof-123',
        idContrato: 'contrato-123',
        aula: {
          dataAula: '2025-01-10',
          horaInicial: '08:00',
          horaFinal: '10:00',
          tipo: 'REPOSICAO',
          observacao: 'Reposição'
        }
      };

      const result = controller.aulaPrepareData(input);
      expect(result.status).toBe('AGENDADA');
    });

    test('deve incluir observacao quando fornecida', () => {
      const input = {
        idAluno: 'aluno-123',
        idProfessor: 'prof-123',
        idContrato: 'contrato-123',
        aula: {
          dataAula: '2025-01-10',
          horaInicial: '08:00',
          horaFinal: '10:00',
          tipo: 'REGULAR',
          observacao: 'Observação importante'
        }
      };

      const result = controller.aulaPrepareData(input);
      expect(result.observacao).toBe('Observação importante');
    });
  });

  describe('sortAulasByDate', () => {
    test('deve ordenar aulas por data crescente', () => {
      controller.aulasData = [
        { id: '3', dataAula: '2025-01-20' },
        { id: '1', dataAula: '2025-01-10' },
        { id: '2', dataAula: '2025-01-15' }
      ];

      controller.sortAulasByDate();

      expect(controller.aulasData[0].id).toBe('1');
      expect(controller.aulasData[1].id).toBe('2');
      expect(controller.aulasData[2].id).toBe('3');
    });

    test('deve retornar array ordenado', () => {
      controller.aulasData = [
        { dataAula: '2025-12-31' },
        { dataAula: '2025-01-01' },
        { dataAula: '2025-06-15' }
      ];

      const result = controller.sortAulasByDate();
      expect(result).toBe(controller.aulasData);
      expect(result[0].dataAula).toBe('2025-01-01');
      expect(result[1].dataAula).toBe('2025-06-15');
      expect(result[2].dataAula).toBe('2025-12-31');
    });

    test('deve lidar com array vazio', () => {
      controller.aulasData = [];
      const result = controller.sortAulasByDate();
      expect(result).toEqual([]);
    });

    test('deve lidar com um único elemento', () => {
      controller.aulasData = [{ dataAula: '2025-01-10' }];
      const result = controller.sortAulasByDate();
      expect(result.length).toBe(1);
    });
  });

  describe('execute() - Validações', () => {
    test('deve retornar 422 quando aluno não existe', async () => {
      GetAlunoService.handle = async () => null;

      await controller.execute();

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Aluno não encontrado');
    });

    test('deve retornar 422 quando contrato não existe', async () => {
      GetContratoService.handle = async () => null;

      await controller.execute();

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Contrato não encontrado');
    });

    test('deve retornar 422 quando professor não existe', async () => {
      GetUserService.handle = async () => null;

      await controller.execute();

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Professor não encontrado');
    });

    test('deve validar aluno, contrato e professor antes de processar', async () => {
      let alunoValidated = false;

      GetAlunoService.handle = async () => {
        alunoValidated = true;
        return null;
      };

      await controller.execute();

      expect(alunoValidated).toBe(true);
      expect(mockRes.statusCode).toBe(422);
    });
  });

  describe('execute() - Criação de aulas', () => {
    test('deve retornar 201 ao criar aulas com sucesso', async () => {
      let createCount = 0;
      CreateAulaService.handle = async data => {
        createCount++;
        return { id: `aula-${createCount}`, ...data };
      };

      await controller.execute();

      expect(mockRes.statusCode).toBe(201);
      expect(mockRes.data).toHaveProperty('count');
      expect(mockRes.data).toHaveProperty('aulas');
      expect(Array.isArray(mockRes.data.aulas)).toBe(true);
    });

    test('deve chamar CreateAulaService para cada aula nova', async () => {
      let createCalls = 0;
      CreateAulaService.handle = async data => {
        createCalls++;
        return { id: `aula-${createCalls}`, ...data };
      };

      await controller.execute();

      expect(createCalls).toBe(2);
    });

    test('deve usar validatedId quando disponível', async () => {
      mockReq.validatedId = 'validated-id';
      mockReq.params.id = 'params-id';

      let usedId = null;
      GetAulaListService.handle = async ({ idContrato }) => {
        usedId = idContrato;
        return [];
      };

      await controller.execute();

      expect(usedId).toBe('validated-id');
    });

    test('deve usar params.id quando validatedId não disponível', async () => {
      mockReq.validatedId = undefined;
      mockReq.params.id = 'params-id';

      let usedId = null;
      GetAulaListService.handle = async ({ idContrato }) => {
        usedId = idContrato;
        return [];
      };

      await controller.execute();

      expect(usedId).toBe('params-id');
    });
  });

  describe('execute() - Atualização de aulas', () => {
    test('deve atualizar aulas existentes com mesma data', async () => {
      GetAulaListService.handle = async () => [
        {
          id: 'existing-aula',
          dataAula: '2025-01-10',
          horaInicial: '07:00',
          horaFinal: '09:00'
        }
      ];

      let updateCalled = false;
      UpdateAulaService.handle = async data => {
        updateCalled = true;
        return data;
      };

      await controller.execute();

      expect(updateCalled).toBe(true);
    });

    test('deve chamar UpdateAulaService com dados corretos', async () => {
      GetAulaListService.handle = async () => [
        {
          id: 'existing-aula',
          dataAula: '2025-01-10'
        }
      ];

      let updateData = null;
      UpdateAulaService.handle = async data => {
        updateData = data;
        return data;
      };

      await controller.execute();

      expect(updateData.id).toBe('existing-aula');
      expect(updateData.idAluno).toBe('aluno-123');
      expect(updateData.idProfessor).toBe('professor-123');
    });
  });

  describe('execute() - Exclusão de aulas', () => {
    test('deve deletar aulas que não existem mais', async () => {
      GetAulaListService.handle = async () => [
        {
          id: 'old-aula',
          dataAula: '2025-01-05'
        }
      ];

      let deleteCalled = false;
      let deletedId = null;
      DeleteAulaService.handle = async id => {
        deleteCalled = true;
        deletedId = id;
        return true;
      };

      await controller.execute();

      expect(deleteCalled).toBe(true);
      expect(deletedId).toBe('old-aula');
    });
  });

  describe('execute() - Tratamento de erros', () => {
    test('deve chamar handleError quando ocorrer erro', async () => {
      GetAlunoService.handle = async () => {
        throw new Error('Database error');
      };

      await controller.execute();

      expect(mockRes.statusCode).toBe(500);
      expect(mockRes.data.message).toBe('Erro ao criar aula');
    });

    test('deve usar chave de tradução correta para erros', async () => {
      let translationKey = '';
      mockReq.t = key => {
        translationKey = key;
        return 'Erro ao criar aula';
      };

      GetAlunoService.handle = async () => {
        throw new Error('Test error');
      };

      await controller.execute();

      expect(translationKey).toBe('aulas.create.error');
    });
  });

  describe('handle() - Método estático', () => {
    test('deve ser uma função estática', () => {
      expect(typeof CreateManyAulaController.handle).toBe('function');
    });

    test('deve ser uma função assíncrona', () => {
      expect(CreateManyAulaController.handle.constructor.name).toBe('AsyncFunction');
    });

    test('deve criar nova instância e executar', async () => {
      await CreateManyAulaController.handle(mockReq, mockRes);
      expect(mockRes.statusCode).toBe(201);
    });

    test('deve aceitar parâmetros req e res', () => {
      expect(CreateManyAulaController.handle.length).toBe(2);
    });

    test('deve tratar erros adequadamente', async () => {
      GetAlunoService.handle = async () => {
        throw new Error('Static method error');
      };

      await CreateManyAulaController.handle(mockReq, mockRes);

      expect(mockRes.statusCode).toBe(500);
    });
  });

  describe('Integração completa', () => {
    test('deve processar fluxo completo de criação', async () => {
      let createCount = 0;
      CreateAulaService.handle = async data => {
        createCount++;
        return { id: `aula-${createCount}`, ...data, status: 'AGENDADA' };
      };

      await controller.execute();

      expect(mockRes.statusCode).toBe(201);
      expect(createCount).toBe(2);
      expect(mockRes.data).toHaveProperty('count');
      expect(mockRes.data).toHaveProperty('aulas');
      expect(mockRes.data.count).toBe(2);
      expect(Array.isArray(mockRes.data.aulas)).toBe(true);
      expect(mockRes.data.aulas.length).toBe(2);
    });

    test('deve processar criação, atualização e exclusão juntos', async () => {
      GetAulaListService.handle = async () => [
        { id: 'aula-update', dataAula: '2025-01-10' },
        { id: 'aula-delete', dataAula: '2025-01-01' }
      ];

      let createCount = 0;
      let updateCount = 0;
      let deleteCount = 0;

      CreateAulaService.handle = async () => {
        createCount++;
        return { id: `new-${createCount}` };
      };

      UpdateAulaService.handle = async () => {
        updateCount++;
        return { id: 'updated' };
      };

      DeleteAulaService.handle = async () => {
        deleteCount++;
        return true;
      };

      await controller.execute();

      expect(mockRes.statusCode).toBe(201);
      expect(updateCount).toBe(1);
      expect(createCount).toBe(1);
      expect(deleteCount).toBe(1);
    });

    test('deve preparar dados com todos os campos obrigatórios', async () => {
      let capturedData = null;
      CreateAulaService.handle = async data => {
        capturedData = data;
        return { id: 'new', ...data };
      };

      await controller.execute();

      expect(capturedData).toHaveProperty('idAluno');
      expect(capturedData).toHaveProperty('idProfessor');
      expect(capturedData).toHaveProperty('idContrato');
      expect(capturedData).toHaveProperty('dataAula');
      expect(capturedData).toHaveProperty('horaInicial');
      expect(capturedData).toHaveProperty('horaFinal');
      expect(capturedData).toHaveProperty('tipo');
      expect(capturedData).toHaveProperty('status');
      expect(capturedData.status).toBe('AGENDADA');
    });
  });
});
