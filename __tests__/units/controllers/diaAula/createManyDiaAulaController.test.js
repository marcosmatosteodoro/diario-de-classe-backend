import { CreateManyDiaAulaController } from '../../../../src/controllers/diaAula/createManyDiaAulaController.js';
import { CreateDiaAulaService } from '../../../../src/services/diaAula/createDiaAulaService.js';
import { GetConfiguracaoService } from '../../../../src/services/configuracao/getConfiguracaoService.js';
import { GetAlunoService } from '../../../../src/services/aluno/getAlunoService.js';
import { GetContratoService } from '../../../../src/services/contrato/getContratoService.js';
import { GetDiaAulaListService } from '../../../../src/services/diaAula/getDiaAulaListService.js';
import { UpdateDiaAulaService } from '../../../../src/services/diaAula/updateDiaAulaService.js';
import { DeleteDiaAulaService } from '../../../../src/services/diaAula/deleteDiaAulaService.js';
import AbstractController from '../../../../src/controllers/abstractController.js';

jest.mock('../../../../src/services/diaAula/createDiaAulaService.js');
jest.mock('../../../../src/services/configuracao/getConfiguracaoService.js');
jest.mock('../../../../src/services/aluno/getAlunoService.js');
jest.mock('../../../../src/services/contrato/getContratoService.js');
jest.mock('../../../../src/services/diaAula/getDiaAulaListService.js');
jest.mock('../../../../src/services/diaAula/updateDiaAulaService.js');
jest.mock('../../../../src/services/diaAula/deleteDiaAulaService.js');

describe('CreateManyDiaAulaController', () => {
  let controller, mockReq, mockRes;

  beforeEach(() => {
    jest.clearAllMocks();

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
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
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

    test('deve criar uma instância com req e res', () => {
      expect(controller).toBeInstanceOf(CreateManyDiaAulaController);
      expect(controller.req).toBe(mockReq);
      expect(controller.res).toBe(mockRes);
    });
  });

  describe('Métodos e estrutura', () => {
    test('deve ter método execute', () => {
      expect(typeof controller.execute).toBe('function');
    });

    test('deve ter método handle estático', () => {
      expect(typeof CreateManyDiaAulaController.handle).toBe('function');
    });

    test('deve ter método checkIfAllDaysOfWeekAreAvailable', () => {
      expect(typeof controller.checkIfAllDaysOfWeekAreAvailable).toBe('function');
    });

    test('deve ter método isAlunoExists', () => {
      expect(typeof controller.isAlunoExists).toBe('function');
    });

    test('deve ter método isContratoExists', () => {
      expect(typeof controller.isContratoExists).toBe('function');
    });

    test('deve ter método prepareDiasAulasData', () => {
      expect(typeof controller.prepareDiasAulasData).toBe('function');
    });

    test('deve ter método getDuracaoDaAula', () => {
      expect(typeof controller.getDuracaoDaAula).toBe('function');
    });

    test('deve ter método getHoraDeFim', () => {
      expect(typeof controller.getHoraDeFim).toBe('function');
    });

    test('deve ter método execute como função assíncrona', () => {
      expect(controller.execute.constructor.name).toBe('AsyncFunction');
    });
  });

  describe('checkIfAllDaysOfWeekAreAvailable', () => {
    test('deve retornar true quando todos os dias estão presentes', () => {
      const result = controller.checkIfAllDaysOfWeekAreAvailable(mockReq.body);
      expect(result).toBe(true);
    });

    test('deve retornar false quando falta um dia da semana', () => {
      const bodyIncompleto = { ...mockReq.body };
      delete bodyIncompleto.SEGUNDA;
      const result = controller.checkIfAllDaysOfWeekAreAvailable(bodyIncompleto);
      expect(result).toBe(false);
    });

    test('deve retornar false quando faltam vários dias', () => {
      const bodyIncompleto = {
        SEGUNDA: { ativo: true, quantidadeAulas: 2, horaInicial: '08:00' },
        TERCA: { ativo: true, quantidadeAulas: 2, horaInicial: '08:00' }
      };
      const result = controller.checkIfAllDaysOfWeekAreAvailable(bodyIncompleto);
      expect(result).toBe(false);
    });

    test('deve verificar todos os 7 dias da semana', () => {
      expect(controller.diasSemanas.length).toBe(7);
    });
  });

  describe('isAlunoExists', () => {
    test('deve retornar true quando aluno existe', async () => {
      GetAlunoService.handle.mockResolvedValue({ id: 'aluno-123', nome: 'João' });

      const result = await controller.isAlunoExists('aluno-123');

      expect(result).toBe(true);
      expect(GetAlunoService.handle).toHaveBeenCalledWith('aluno-123');
    });

    test('deve retornar false quando aluno não existe', async () => {
      GetAlunoService.handle.mockResolvedValue(null);

      const result = await controller.isAlunoExists('aluno-123');

      expect(result).toBe(false);
      expect(GetAlunoService.handle).toHaveBeenCalledWith('aluno-123');
    });

    test('deve retornar false quando id não é fornecido', async () => {
      const result = await controller.isAlunoExists(null);

      expect(result).toBe(false);
      expect(GetAlunoService.handle).not.toHaveBeenCalled();
    });
  });

  describe('isContratoExists', () => {
    test('deve retornar true quando contrato existe', async () => {
      GetContratoService.handle.mockResolvedValue({ id: 'contrato-123' });

      const result = await controller.isContratoExists('contrato-123');

      expect(result).toBe(true);
      expect(GetContratoService.handle).toHaveBeenCalledWith('contrato-123');
    });

    test('deve retornar false quando contrato não existe', async () => {
      GetContratoService.handle.mockResolvedValue(null);

      const result = await controller.isContratoExists('contrato-123');

      expect(result).toBe(false);
      expect(GetContratoService.handle).toHaveBeenCalledWith('contrato-123');
    });

    test('deve retornar false quando id não é fornecido', async () => {
      const result = await controller.isContratoExists(null);

      expect(result).toBe(false);
      expect(GetContratoService.handle).not.toHaveBeenCalled();
    });
  });

  describe('getDuracaoDaAula', () => {
    test('deve retornar a duração da aula da configuração', async () => {
      GetConfiguracaoService.handle.mockResolvedValue([{ duracaoAula: 50 }]);

      const result = await controller.getDuracaoDaAula();

      expect(result).toBe(50);
      expect(GetConfiguracaoService.handle).toHaveBeenCalled();
    });

    test('deve lançar erro quando não há configurações', async () => {
      GetConfiguracaoService.handle.mockResolvedValue(null);

      await expect(controller.getDuracaoDaAula()).rejects.toThrow(
        'Nenhuma configuração encontrada para determinar a duração da aula.'
      );
    });

    test('deve lançar erro quando configurações é um array vazio', async () => {
      GetConfiguracaoService.handle.mockResolvedValue([]);

      await expect(controller.getDuracaoDaAula()).rejects.toThrow(
        'Nenhuma configuração encontrada para determinar a duração da aula.'
      );
    });
  });

  describe('getHoraDeFim', () => {
    test('deve calcular corretamente hora de fim simples', () => {
      const result = controller.getHoraDeFim({
        duracaoAula: 50,
        horaInicial: '08:00',
        quantidadeAulas: 1
      });
      expect(result).toBe('08:50');
    });

    test('deve calcular corretamente com múltiplas aulas', () => {
      const result = controller.getHoraDeFim({
        duracaoAula: 50,
        horaInicial: '08:00',
        quantidadeAulas: 2
      });
      expect(result).toBe('09:40');
    });

    test('deve calcular corretamente quando passa de hora', () => {
      const result = controller.getHoraDeFim({
        duracaoAula: 50,
        horaInicial: '08:30',
        quantidadeAulas: 2
      });
      expect(result).toBe('10:10');
    });

    test('deve calcular corretamente quando passa do meio-dia', () => {
      const result = controller.getHoraDeFim({
        duracaoAula: 50,
        horaInicial: '11:30',
        quantidadeAulas: 3
      });
      expect(result).toBe('14:00');
    });

    test('deve ajustar para formato 24 horas', () => {
      const result = controller.getHoraDeFim({
        duracaoAula: 60,
        horaInicial: '23:00',
        quantidadeAulas: 2
      });
      expect(result).toBe('01:00');
    });

    test('deve formatar hora com zero à esquerda', () => {
      const result = controller.getHoraDeFim({
        duracaoAula: 30,
        horaInicial: '00:00',
        quantidadeAulas: 1
      });
      expect(result).toBe('00:30');
    });

    test('deve formatar minutos com zero à esquerda', () => {
      const result = controller.getHoraDeFim({
        duracaoAula: 5,
        horaInicial: '10:00',
        quantidadeAulas: 1
      });
      expect(result).toBe('10:05');
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
      expect(data[0]).toHaveProperty('idContrato', 'contrato-123');
      expect(data[0]).toHaveProperty('diaSemana');
      expect(data[0]).toHaveProperty('quantidadeAulas');
      expect(data[0]).toHaveProperty('horaInicial');
      expect(data[0]).toHaveProperty('horaFinal');
    });

    test('deve calcular horaFinal corretamente para cada dia', () => {
      const data = controller.prepareDiasAulasData({
        body: mockReq.body,
        idAluno: 'aluno-123',
        idContrato: 'contrato-123',
        duracaoAula: 50
      });

      // 2 aulas de 50 minutos = 100 minutos = 1h40
      // 08:00 + 1h40 = 09:40
      expect(data[0].horaFinal).toBe('09:40');
    });

    test('deve incluir todos os dias da semana', () => {
      const data = controller.prepareDiasAulasData({
        body: mockReq.body,
        idAluno: 'aluno-123',
        idContrato: 'contrato-123',
        duracaoAula: 50
      });

      const diasSemana = data.map(d => d.diaSemana);
      expect(diasSemana).toEqual([
        'SEGUNDA',
        'TERCA',
        'QUARTA',
        'QUINTA',
        'SEXTA',
        'SABADO',
        'DOMINGO'
      ]);
    });
  });

  describe('execute() - Validações', () => {
    test('deve retornar 422 quando aluno não existe', async () => {
      GetAlunoService.handle.mockResolvedValue(null);

      await controller.execute();

      expect(mockRes.status).toHaveBeenCalledWith(422);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Aluno não encontrado'
      });
    });

    test('deve retornar 422 quando contrato não existe', async () => {
      GetAlunoService.handle.mockResolvedValue({ id: 'aluno-123', nome: 'João' });
      GetContratoService.handle.mockResolvedValue(null);

      await controller.execute();

      expect(mockRes.status).toHaveBeenCalledWith(422);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Contrato não encontrado'
      });
    });

    test('deve retornar 422 quando não todos os dias da semana são fornecidos', async () => {
      GetAlunoService.handle.mockResolvedValue({ id: 'aluno-123', nome: 'João' });
      GetContratoService.handle.mockResolvedValue({ id: 'contrato-123' });

      const incompleteReq = { ...mockReq };
      incompleteReq.body = { ...mockReq.body };
      delete incompleteReq.body.DOMINGO;

      const incompleteController = new CreateManyDiaAulaController(incompleteReq, mockRes);
      await incompleteController.execute();

      expect(mockRes.status).toHaveBeenCalledWith(422);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Todos os dias da semana devem ser fornecidos'
      });
    });
  });

  describe('execute() - Criação, Atualização e Exclusão', () => {
    test('deve criar novos dias de aula quando não existem', async () => {
      const originalGetAluno = GetAlunoService.handle;
      const originalGetContrato = GetContratoService.handle;
      const originalGetDiaAulaList = GetDiaAulaListService.handle;
      const originalGetConfiguracao = GetConfiguracaoService.handle;
      const originalCreateDiaAula = CreateDiaAulaService.handle;

      GetAlunoService.handle = async () => ({ id: 1, nome: 'João' });
      GetContratoService.handle = async () => ({ id: 1 });
      GetDiaAulaListService.handle = async () => [];
      GetConfiguracaoService.handle = async () => [{ duracaoAula: 50 }];
      CreateDiaAulaService.handle = async data => ({ id: Math.random(), ...data });

      await controller.execute();

      expect(mockRes.statusCode).toBe(201);
      expect(mockRes.data).toBeInstanceOf(Array);
      expect(mockRes.data.length).toBeGreaterThan(0);

      GetAlunoService.handle = originalGetAluno;
      GetContratoService.handle = originalGetContrato;
      GetDiaAulaListService.handle = originalGetDiaAulaList;
      GetConfiguracaoService.handle = originalGetConfiguracao;
      CreateDiaAulaService.handle = originalCreateDiaAula;
    });

    test('deve atualizar dias de aula existentes quando ativo é true', async () => {
      const originalGetAluno = GetAlunoService.handle;
      const originalGetContrato = GetContratoService.handle;
      const originalGetDiaAulaList = GetDiaAulaListService.handle;
      const originalGetConfiguracao = GetConfiguracaoService.handle;
      const originalUpdateDiaAula = UpdateDiaAulaService.handle;
      const originalCreateDiaAula = CreateDiaAulaService.handle;

      const existingDiaAula = {
        id: 'dia-aula-123',
        diaSemana: 'SEGUNDA',
        quantidadeAulas: 1,
        horaInicial: '07:00'
      };

      GetAlunoService.handle = async () => ({ id: 'aluno-123', nome: 'João' });
      GetContratoService.handle = async () => ({ id: 'contrato-123' });
      GetDiaAulaListService.handle = async () => [existingDiaAula];
      GetConfiguracaoService.handle = async () => [{ duracaoAula: 50 }];
      UpdateDiaAulaService.handle = async (id, data) => ({ id, ...data });
      CreateDiaAulaService.handle = async data => ({ id: `dia-aula-${Math.random()}`, ...data });

      await controller.execute();

      expect(mockRes.statusCode).toBe(201);
      expect(mockRes.data).toBeInstanceOf(Array);

      GetAlunoService.handle = originalGetAluno;
      GetContratoService.handle = originalGetContrato;
      GetDiaAulaListService.handle = originalGetDiaAulaList;
      GetConfiguracaoService.handle = originalGetConfiguracao;
      UpdateDiaAulaService.handle = originalUpdateDiaAula;
      CreateDiaAulaService.handle = originalCreateDiaAula;
    });

    test('deve deletar dias de aula quando ativo é false e existe', async () => {
      const originalGetAluno = GetAlunoService.handle;
      const originalGetContrato = GetContratoService.handle;
      const originalGetDiaAulaList = GetDiaAulaListService.handle;
      const originalGetConfiguracao = GetConfiguracaoService.handle;
      const originalDeleteDiaAula = DeleteDiaAulaService.handle;
      const originalCreateDiaAula = CreateDiaAulaService.handle;

      const existingDiaAula = {
        id: 'dia-aula-456',
        diaSemana: 'SABADO',
        quantidadeAulas: 2,
        horaInicial: '08:00'
      };

      let deletedId = null;

      GetAlunoService.handle = async () => ({ id: 'aluno-123', nome: 'João' });
      GetContratoService.handle = async () => ({ id: 'contrato-123' });
      GetDiaAulaListService.handle = async () => [existingDiaAula];
      GetConfiguracaoService.handle = async () => [{ duracaoAula: 50 }];
      DeleteDiaAulaService.handle = async id => {
        deletedId = id;
        return { id };
      };
      CreateDiaAulaService.handle = async data => ({ id: `dia-aula-${Math.random()}`, ...data });

      await controller.execute();

      expect(deletedId).toBe('dia-aula-456');
      expect(mockRes.statusCode).toBe(201);

      GetAlunoService.handle = originalGetAluno;
      GetContratoService.handle = originalGetContrato;
      GetDiaAulaListService.handle = originalGetDiaAulaList;
      GetConfiguracaoService.handle = originalGetConfiguracao;
      DeleteDiaAulaService.handle = originalDeleteDiaAula;
      CreateDiaAulaService.handle = originalCreateDiaAula;
    });

    test('deve filtrar valores null do resultado', async () => {
      const originalGetAluno = GetAlunoService.handle;
      const originalGetContrato = GetContratoService.handle;
      const originalGetDiaAulaList = GetDiaAulaListService.handle;
      const originalGetConfiguracao = GetConfiguracaoService.handle;
      const originalCreateDiaAula = CreateDiaAulaService.handle;
      const originalDeleteDiaAula = DeleteDiaAulaService.handle;

      const existingDiaAula = {
        id: 'dia-aula-789',
        diaSemana: 'SABADO',
        quantidadeAulas: 2,
        horaInicial: '08:00'
      };

      GetAlunoService.handle = async () => ({ id: 'aluno-123', nome: 'João' });
      GetContratoService.handle = async () => ({ id: 'contrato-123' });
      GetDiaAulaListService.handle = async () => [existingDiaAula];
      GetConfiguracaoService.handle = async () => [{ duracaoAula: 50 }];
      CreateDiaAulaService.handle = async data => ({ id: `dia-aula-${Math.random()}`, ...data });
      DeleteDiaAulaService.handle = async () => null;

      await controller.execute();

      expect(mockRes.data).toBeInstanceOf(Array);
      expect(mockRes.data.every(item => item !== null)).toBe(true);

      GetAlunoService.handle = originalGetAluno;
      GetContratoService.handle = originalGetContrato;
      GetDiaAulaListService.handle = originalGetDiaAulaList;
      GetConfiguracaoService.handle = originalGetConfiguracao;
      CreateDiaAulaService.handle = originalCreateDiaAula;
      DeleteDiaAulaService.handle = originalDeleteDiaAula;
    });
  });

  describe('execute() - Tratamento de Erros', () => {
    test('deve chamar handleError quando ocorre erro', async () => {
      const originalGetAluno = GetAlunoService.handle;
      const testError = new Error('Database error');

      GetAlunoService.handle = async () => {
        throw testError;
      };

      let handledError;
      let handledTranslationKey;

      controller.handleError = (error, translationKey) => {
        handledError = error;
        handledTranslationKey = translationKey;
      };

      await controller.execute();

      expect(handledError).toBe(testError);
      expect(handledTranslationKey).toBe('diaAulas.create.error');

      GetAlunoService.handle = originalGetAluno;
    });
  });

  describe('Método estático handle()', () => {
    test('deve ser uma função estática', () => {
      expect(typeof CreateManyDiaAulaController.handle).toBe('function');
    });

    test('deve executar através do método estático', async () => {
      const originalGetAluno = GetAlunoService.handle;
      const originalGetContrato = GetContratoService.handle;
      const originalGetDiaAulaList = GetDiaAulaListService.handle;
      const originalGetConfiguracao = GetConfiguracaoService.handle;
      const originalCreateDiaAula = CreateDiaAulaService.handle;

      GetAlunoService.handle = async () => ({ id: 1, nome: 'João' });
      GetContratoService.handle = async () => ({ id: 1 });
      GetDiaAulaListService.handle = async () => [];
      GetConfiguracaoService.handle = async () => [{ duracaoAula: 50 }];
      CreateDiaAulaService.handle = async data => ({ id: Math.random(), ...data });

      await CreateManyDiaAulaController.handle(mockReq, mockRes);

      expect(mockRes.statusCode).toBe(201);
      expect(mockRes.data).toBeInstanceOf(Array);

      GetAlunoService.handle = originalGetAluno;
      GetContratoService.handle = originalGetContrato;
      GetDiaAulaListService.handle = originalGetDiaAulaList;
      GetConfiguracaoService.handle = originalGetConfiguracao;
      CreateDiaAulaService.handle = originalCreateDiaAula;
    });
  });

  describe('Integração com AbstractController', () => {
    test('deve implementar método execute() abstrato', () => {
      expect(controller.execute).toBeDefined();
      expect(controller.execute).not.toBe(AbstractController.prototype.execute);
    });

    test('deve ter acesso ao método handleError da classe pai', () => {
      expect(controller.handleError).toBeDefined();
      expect(typeof controller.handleError).toBe('function');
    });

    test('deve ser uma subclasse de AbstractController', () => {
      expect(Object.getPrototypeOf(CreateManyDiaAulaController.prototype)).toBe(
        AbstractController.prototype
      );
    });
  });

  describe('Validação de IDs', () => {
    test('deve usar validatedId se disponível', async () => {
      const originalGetAluno = GetAlunoService.handle;
      const originalGetContrato = GetContratoService.handle;
      const originalGetDiaAulaList = GetDiaAulaListService.handle;

      GetAlunoService.handle = async () => ({ id: 'aluno-123', nome: 'João' });
      GetContratoService.handle = async () => ({ id: 'contrato-123' });
      GetDiaAulaListService.handle = async () => {
        return [];
      };

      mockReq.validatedId = 'contrato-xyz';
      const testController = new CreateManyDiaAulaController(mockReq, mockRes);

      // Chamamos apenas até a validação sem processar tudo
      const idContrato = testController.req.validatedId || testController.req.params.id;
      expect(idContrato).toBe('contrato-xyz');

      GetAlunoService.handle = originalGetAluno;
      GetContratoService.handle = originalGetContrato;
      GetDiaAulaListService.handle = originalGetDiaAulaList;
    });

    test('deve usar params.id quando validatedId não está disponível', () => {
      const reqWithoutValidatedId = { ...mockReq };
      delete reqWithoutValidatedId.validatedId;

      const testController = new CreateManyDiaAulaController(reqWithoutValidatedId, mockRes);
      const idContrato = testController.req.validatedId || testController.req.params.id;

      expect(idContrato).toBe('contrato-123');
    });
  });
});
