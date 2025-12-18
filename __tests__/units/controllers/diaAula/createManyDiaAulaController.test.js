import { CreateManyDiaAulaController } from '../../../../src/controllers/diaAula/createManyDiaAulaController.js';
import { CreateDiaAulaService } from '../../../../src/services/diaAula/createDiaAulaService.js';
import { GetConfiguracaoService } from '../../../../src/services/configuracao/getConfiguracaoService.js';
import { GetAlunoService } from '../../../../src/services/aluno/getAlunoService.js';
import { GetContratoService } from '../../../../src/services/contrato/getContratoService.js';
import { GetDiaAulaListService } from '../../../../src/services/diaAula/getDiaAulaListService.js';
import { UpdateDiaAulaService } from '../../../../src/services/diaAula/updateDiaAulaService.js';
import { DeleteDiaAulaService } from '../../../../src/services/diaAula/deleteDiaAulaService.js';
import AbstractController from '../../../../src/controllers/abstractController.js';

describe('CreateManyDiaAulaController', () => {
  let controller, mockReq, mockRes;
  let originalGetAluno, originalGetContrato, originalGetConfiguracao, originalGetDiaAulaList;
  let originalCreateDiaAula, originalUpdateDiaAula, originalDeleteDiaAula;

  beforeAll(() => {
    originalGetAluno = GetAlunoService.handle;
    originalGetContrato = GetContratoService.handle;
    originalGetConfiguracao = GetConfiguracaoService.handle;
    originalGetDiaAulaList = GetDiaAulaListService.handle;
    originalCreateDiaAula = CreateDiaAulaService.handle;
    originalUpdateDiaAula = UpdateDiaAulaService.handle;
    originalDeleteDiaAula = DeleteDiaAulaService.handle;
  });

  afterAll(() => {
    GetAlunoService.handle = originalGetAluno;
    GetContratoService.handle = originalGetContrato;
    GetConfiguracaoService.handle = originalGetConfiguracao;
    GetDiaAulaListService.handle = originalGetDiaAulaList;
    CreateDiaAulaService.handle = originalCreateDiaAula;
    UpdateDiaAulaService.handle = originalUpdateDiaAula;
    DeleteDiaAulaService.handle = originalDeleteDiaAula;
  });

  beforeEach(() => {
    mockReq = {
      params: { id: 'contrato-123' },
      validatedId: 'contrato-123',
      body: {
        idAluno: 'aluno-123',
        idContrato: 'contrato-123',
        SEGUNDA: { ativo: true, quantidadeAulas: 2, horaInicial: '08:00' },
        TERCA: { ativo: true, quantidadeAulas: 2, horaInicial: '08:00' },
        QUARTA: { ativo: true, quantidadeAulas: 2, horaInicial: '08:00' },
        QUINTA: { ativo: true, quantidadeAulas: 2, horaInicial: '08:00' },
        SEXTA: { ativo: true, quantidadeAulas: 2, horaInicial: '08:00' },
        SABADO: { ativo: false, quantidadeAulas: 0, horaInicial: '08:00' },
        DOMINGO: { ativo: false, quantidadeAulas: 0, horaInicial: '08:00' }
      },
      t: key => {
        const translations = {
          'diaAulas.error.aluno_not_exists': 'Aluno não encontrado',
          'diaAulas.error.contrato_not_exists': 'Contrato não encontrado',
          'diaAulas.error.days_of_week_not_provided':
            'Todos os dias da semana devem ser fornecidos',
          'diaAulas.create.error': 'Erro ao criar dia de aula'
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

    controller = new CreateManyDiaAulaController(mockReq, mockRes);
  });

  describe('Inicialização', () => {
    test('deve herdar de AbstractController', () => {
      expect(controller).toBeInstanceOf(AbstractController);
    });

    test('deve ter acesso ao req e res', () => {
      expect(controller.req).toBe(mockReq);
      expect(controller.res).toBe(mockRes);
    });

    test('deve inicializar propriedades corretamente', () => {
      expect(controller.diasSemanas).toEqual([
        'SEGUNDA',
        'TERCA',
        'QUARTA',
        'QUINTA',
        'SEXTA',
        'SABADO',
        'DOMINGO'
      ]);
      expect(controller.diasAulasData).toEqual([]);
      expect(controller.data).toEqual([]);
    });
  });

  describe('checkIfAllDaysOfWeekAreAvailable', () => {
    test('deve retornar true quando todos os dias estão presentes', () => {
      expect(controller.checkIfAllDaysOfWeekAreAvailable(mockReq.body)).toBe(true);
    });

    test('deve retornar false quando falta um dia da semana', () => {
      const bodyIncompleto = { ...mockReq.body };
      delete bodyIncompleto.SEGUNDA;
      expect(controller.checkIfAllDaysOfWeekAreAvailable(bodyIncompleto)).toBe(false);
    });
  });

  describe('isAlunoExists', () => {
    test('deve retornar true quando aluno existe', async () => {
      GetAlunoService.handle = async () => ({ id: 'aluno-123', nome: 'João' });
      expect(await controller.isAlunoExists('aluno-123')).toBe(true);
    });

    test('deve retornar false quando aluno não existe', async () => {
      GetAlunoService.handle = async () => null;
      expect(await controller.isAlunoExists('aluno-123')).toBe(false);
    });

    test('deve retornar false quando id não é fornecido', async () => {
      expect(await controller.isAlunoExists(null)).toBe(false);
    });
  });

  describe('isContratoExists', () => {
    test('deve retornar true quando contrato existe', async () => {
      GetContratoService.handle = async () => ({ id: 'contrato-123' });
      expect(await controller.isContratoExists('contrato-123')).toBe(true);
    });

    test('deve retornar false quando contrato não existe', async () => {
      GetContratoService.handle = async () => null;
      expect(await controller.isContratoExists('contrato-123')).toBe(false);
    });

    test('deve retornar false quando id não é fornecido', async () => {
      expect(await controller.isContratoExists(null)).toBe(false);
    });
  });

  describe('getDuracaoDaAula', () => {
    test('deve retornar a duração da aula da configuração', async () => {
      GetConfiguracaoService.handle = async () => [{ duracaoAula: 50 }];
      expect(await controller.getDuracaoDaAula()).toBe(50);
    });

    test('deve lançar erro quando não há configurações', async () => {
      GetConfiguracaoService.handle = async () => null;
      await expect(controller.getDuracaoDaAula()).rejects.toThrow(
        'Nenhuma configuração encontrada para determinar a duração da aula.'
      );
    });
  });

  describe('getHoraDeFim', () => {
    test('deve calcular corretamente hora de fim simples', () => {
      expect(
        controller.getHoraDeFim({ duracaoAula: 50, horaInicial: '08:00', quantidadeAulas: 1 })
      ).toBe('08:50');
    });

    test('deve calcular corretamente com múltiplas aulas', () => {
      expect(
        controller.getHoraDeFim({ duracaoAula: 50, horaInicial: '08:00', quantidadeAulas: 2 })
      ).toBe('09:40');
    });

    test('deve ajustar para formato 24 horas', () => {
      expect(
        controller.getHoraDeFim({ duracaoAula: 60, horaInicial: '23:00', quantidadeAulas: 2 })
      ).toBe('01:00');
    });
  });

  describe('prepareDiasAulasData', () => {
    test('deve preparar dados para todos os dias da semana', () => {
      const data = controller.prepareDiasAulasData({
        body: mockReq.body,
        idAluno: 'aluno-123',
        idContrato: 'contrato-123',
        duracaoAula: 50
      });
      expect(data).toHaveLength(7);
      expect(data[0]).toHaveProperty('idAluno', 'aluno-123');
      expect(data[0]).toHaveProperty('diaSemana');
    });
  });

  describe('execute() - Validações', () => {
    test('deve retornar 422 quando aluno não existe', async () => {
      GetAlunoService.handle = async () => null;
      GetDiaAulaListService.handle = async () => [];
      GetConfiguracaoService.handle = async () => [{ duracaoAula: 50 }];
      await controller.execute();
      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data).toEqual({ message: 'Aluno não encontrado' });
    });

    test('deve retornar 422 quando contrato não existe', async () => {
      GetAlunoService.handle = async () => ({ id: 'aluno-123' });
      GetContratoService.handle = async () => null;
      GetDiaAulaListService.handle = async () => [];
      GetConfiguracaoService.handle = async () => [{ duracaoAula: 50 }];
      await controller.execute();
      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data).toEqual({ message: 'Contrato não encontrado' });
    });

    test('deve retornar 422 quando dias da semana não são fornecidos', async () => {
      GetAlunoService.handle = async () => ({ id: 'aluno-123' });
      GetContratoService.handle = async () => ({ id: 'contrato-123' });
      GetDiaAulaListService.handle = async () => [];
      GetConfiguracaoService.handle = async () => [{ duracaoAula: 50 }];
      const incompleteReq = { ...mockReq, body: { ...mockReq.body } };
      delete incompleteReq.body.DOMINGO;
      const incompleteController = new CreateManyDiaAulaController(incompleteReq, mockRes);
      await incompleteController.execute();
      expect(mockRes.statusCode).toBe(422);
    });
  });

  describe('execute() - Criação, Atualização e Exclusão', () => {
    test('deve criar novos dias de aula quando não existem', async () => {
      GetAlunoService.handle = async () => ({ id: 1 });
      GetContratoService.handle = async () => ({ id: 1 });
      GetDiaAulaListService.handle = async () => [];
      GetConfiguracaoService.handle = async () => [{ duracaoAula: 50 }];
      CreateDiaAulaService.handle = async data => ({ id: Math.random(), ...data });
      await controller.execute();
      expect(mockRes.statusCode).toBe(201);
      expect(mockRes.data).toBeInstanceOf(Array);
    });

    test('deve atualizar dias existentes quando ativo é true', async () => {
      const existing = { id: 'dia-aula-123', diaSemana: 'SEGUNDA' };
      GetAlunoService.handle = async () => ({ id: 'aluno-123' });
      GetContratoService.handle = async () => ({ id: 'contrato-123' });
      GetDiaAulaListService.handle = async () => [existing];
      GetConfiguracaoService.handle = async () => [{ duracaoAula: 50 }];
      UpdateDiaAulaService.handle = async (id, data) => ({ id, ...data });
      CreateDiaAulaService.handle = async data => ({ id: Math.random(), ...data });
      await controller.execute();
      expect(mockRes.statusCode).toBe(201);
    });

    test('deve deletar dias quando ativo é false', async () => {
      const existing = { id: 'dia-aula-456', diaSemana: 'SABADO' };
      let deletedId = null;
      GetAlunoService.handle = async () => ({ id: 'aluno-123' });
      GetContratoService.handle = async () => ({ id: 'contrato-123' });
      GetDiaAulaListService.handle = async () => [existing];
      GetConfiguracaoService.handle = async () => [{ duracaoAula: 50 }];
      DeleteDiaAulaService.handle = async id => {
        deletedId = id;
        return { id };
      };
      CreateDiaAulaService.handle = async data => ({ id: Math.random(), ...data });
      await controller.execute();
      expect(deletedId).toBe('dia-aula-456');
    });
  });

  describe('execute() - Tratamento de Erros', () => {
    test('deve chamar handleError quando ocorre erro', async () => {
      const testError = new Error('Database error');
      GetAlunoService.handle = async () => {
        throw testError;
      };
      let handledError;
      controller.handleError = error => {
        handledError = error;
      };
      await controller.execute();
      expect(handledError).toBe(testError);
    });
  });

  describe('Método estático handle()', () => {
    test('deve executar através do método estático', async () => {
      GetAlunoService.handle = async () => ({ id: 1 });
      GetContratoService.handle = async () => ({ id: 1 });
      GetDiaAulaListService.handle = async () => [];
      GetConfiguracaoService.handle = async () => [{ duracaoAula: 50 }];
      CreateDiaAulaService.handle = async data => ({ id: Math.random(), ...data });
      await CreateManyDiaAulaController.handle(mockReq, mockRes);
      expect(mockRes.statusCode).toBe(201);
    });
  });
});
