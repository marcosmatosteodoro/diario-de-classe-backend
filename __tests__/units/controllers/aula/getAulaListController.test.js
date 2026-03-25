import { jest } from '@jest/globals';
import { GetAulaListController } from '../../../../src/controllers/aula/getAulaListController.js';
import { GetAulaListService } from '../../../../src/services/aula/getAulaListService.js';
import AbstractController from '../../../../src/controllers/abstractController.js';

jest.mock('../../../../src/services/aula/getAulaListService.js');

describe('GetAulaListController', () => {
  let mockReq, mockRes;
  let handleServiceMock;

  beforeEach(() => {
    mockReq = {
      query: {},
      user: {
        id: 'user-123',
        isAdmin: false
      },
      t: key => {
        const translations = {
          'aulas.list.error': 'Erro ao buscar aulas'
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

    handleServiceMock = jest.fn();
    GetAulaListService.handle = handleServiceMock;
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    test('deve criar uma instância com req e res', () => {
      const controller = new GetAulaListController(mockReq, mockRes);

      expect(controller).toBeInstanceOf(GetAulaListController);
      expect(controller.req).toBe(mockReq);
      expect(controller.res).toBe(mockRes);
    });

    test('deve herdar de AbstractController', () => {
      const controller = new GetAulaListController(mockReq, mockRes);

      expect(controller).toBeInstanceOf(AbstractController);
    });

    test('deve inicializar where com filtro de professor para não admin', () => {
      const controller = new GetAulaListController(mockReq, mockRes);

      expect(controller.where.idProfessor).toBe('user-123');
    });

    test('deve inicializar where vazio para admin', () => {
      mockReq.user.isAdmin = true;
      const controller = new GetAulaListController(mockReq, mockRes);

      expect(controller.where).toEqual({});
    });

    test('deve ter método execute implementado', () => {
      const controller = new GetAulaListController(mockReq, mockRes);

      expect(controller.execute).toBeDefined();
      expect(typeof controller.execute).toBe('function');
    });

    test('deve ter método estático handle', () => {
      expect(GetAulaListController.handle).toBeDefined();
      expect(typeof GetAulaListController.handle).toBe('function');
    });
  });

  describe('bindMainWhere', () => {
    test('deve adicionar filtro de data quando dataInicio é fornecido', () => {
      mockReq.query.dataInicio = '2025-01-13';
      const controller = new GetAulaListController(mockReq, mockRes);

      expect(controller.where.dataAula).toBeDefined();
      expect(controller.where.dataAula.gte).toEqual(new Date('2025-01-13T00:00:00.000Z'));
      expect(controller.where.dataAula.lte).toEqual(new Date('2025-01-13T23:59:59.999Z'));
    });

    test('deve usar dataInicio e dataTermino quando ambas são fornecidas', () => {
      mockReq.query.dataInicio = '2025-01-10';
      mockReq.query.dataTermino = '2025-01-15';
      const controller = new GetAulaListController(mockReq, mockRes);

      expect(controller.where.dataAula.gte).toEqual(new Date('2025-01-10T00:00:00.000Z'));
      expect(controller.where.dataAula.lte).toEqual(new Date('2025-01-15T23:59:59.999Z'));
    });

    test('não deve adicionar filtro de data quando dataInicio não é fornecido', () => {
      const controller = new GetAulaListController(mockReq, mockRes);

      expect(controller.where.dataAula).toBeUndefined();
    });

    test('deve adicionar filtro de tipo quando fornecido', () => {
      mockReq.query.tipo = 'PARTICULAR';
      const controller = new GetAulaListController(mockReq, mockRes);

      expect(controller.where.tipo).toBe('PARTICULAR');
    });

    test('deve adicionar filtro de status quando fornecido', () => {
      mockReq.query.status = 'ATIVA';
      const controller = new GetAulaListController(mockReq, mockRes);

      expect(controller.where.status).toBe('ATIVA');
    });

    test('deve adicionar filtro por nome de aluno quando fornecido', () => {
      mockReq.query.aluno = 'João';
      const controller = new GetAulaListController(mockReq, mockRes);

      expect(controller.where.aluno).toEqual({
        nome: {
          contains: 'João',
          mode: 'insensitive'
        }
      });
    });

    test('deve adicionar filtro por nome de professor quando fornecido', () => {
      mockReq.query.professor = 'Maria';
      const controller = new GetAulaListController(mockReq, mockRes);

      expect(controller.where.professor).toEqual({
        nome: {
          contains: 'Maria',
          mode: 'insensitive'
        }
      });
    });

    test('deve adicionar filtro de busca geral (q) com OR para aluno e professor', () => {
      mockReq.query.q = 'Test';
      const controller = new GetAulaListController(mockReq, mockRes);

      expect(controller.where.OR).toBeDefined();
      expect(controller.where.OR.length).toBe(2);
      expect(controller.where.OR[0]).toEqual({
        aluno: {
          nome: {
            contains: 'Test',
            mode: 'insensitive'
          }
        }
      });
      expect(controller.where.OR[1]).toEqual({
        professor: {
          nome: {
            contains: 'Test',
            mode: 'insensitive'
          }
        }
      });
    });

    test('deve combinar múltiplos filtros', () => {
      mockReq.query.dataInicio = '2025-01-10';
      mockReq.query.tipo = 'GRUPO';
      mockReq.query.status = 'ATIVA';
      mockReq.query.aluno = 'João';
      const controller = new GetAulaListController(mockReq, mockRes);

      expect(controller.where.dataAula).toBeDefined();
      expect(controller.where.tipo).toBe('GRUPO');
      expect(controller.where.status).toBe('ATIVA');
      expect(controller.where.aluno).toBeDefined();
    });
  });

  describe('getParams', () => {
    test('deve definir parâmetros de seleção corretamente', () => {
      const controller = new GetAulaListController(mockReq, mockRes);

      expect(controller.params).toBeDefined();
      expect(controller.params.select).toBeDefined();
    });

    test('deve incluir campos obrigatórios na seleção', () => {
      const controller = new GetAulaListController(mockReq, mockRes);

      expect(controller.params.select.id).toBe(true);
      expect(controller.params.select.dataAula).toBe(true);
      expect(controller.params.select.horaInicial).toBe(true);
      expect(controller.params.select.horaFinal).toBe(true);
      expect(controller.params.select.tipo).toBe(true);
      expect(controller.params.select.status).toBe(true);
    });

    test('deve excluir campos desnecessários da seleção', () => {
      const controller = new GetAulaListController(mockReq, mockRes);

      expect(controller.params.select.idAluno).toBe(false);
      expect(controller.params.select.idProfessor).toBe(false);
      expect(controller.params.select.idContrato).toBe(false);
      expect(controller.params.select.duracaoAula).toBe(false);
      expect(controller.params.select.observacao).toBe(false);
      expect(controller.params.select.dataCriacao).toBe(false);
      expect(controller.params.select.dataAtualizacao).toBe(false);
    });

    test('deve incluir relações com seleção apenas do nome', () => {
      const controller = new GetAulaListController(mockReq, mockRes);

      expect(controller.params.select.aluno).toEqual({ select: { nome: true } });
      expect(controller.params.select.professor).toEqual({ select: { nome: true } });
    });
  });

  describe('execute', () => {
    test('deve retornar 200 com lista de aulas quando encontradas', async () => {
      const aulasMock = [
        { id: 1, nome: 'Aula 1' },
        { id: 2, nome: 'Aula 2' }
      ];
      handleServiceMock.mockResolvedValue(aulasMock);

      const controller = new GetAulaListController(mockReq, mockRes);
      await controller.execute();

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        count: 2,
        data: aulasMock
      });
    });

    test('deve retornar 204 quando não houver aulas', async () => {
      handleServiceMock.mockResolvedValue([]);

      const controller = new GetAulaListController(mockReq, mockRes);
      await controller.execute();

      expect(mockRes.status).toHaveBeenCalledWith(204);
      expect(mockRes.json).toHaveBeenCalledWith();
    });

    test('deve retornar 204 quando aulas for null', async () => {
      handleServiceMock.mockResolvedValue(null);

      const controller = new GetAulaListController(mockReq, mockRes);
      await controller.execute();

      expect(mockRes.status).toHaveBeenCalledWith(204);
    });

    test('deve chamar GetAulaListService.handle com where e params corretos', async () => {
      mockReq.query.tipo = 'PARTICULAR';
      handleServiceMock.mockResolvedValue([]);

      const controller = new GetAulaListController(mockReq, mockRes);
      await controller.execute();

      expect(handleServiceMock).toHaveBeenCalledWith(
        expect.objectContaining({ tipo: 'PARTICULAR' }),
        expect.objectContaining({ select: expect.any(Object) })
      );
    });

    test('deve tratar erros e chamar handleError', async () => {
      const error = new Error('Database error');
      handleServiceMock.mockRejectedValue(error);

      const controller = new GetAulaListController(mockReq, mockRes);
      const handleErrorSpy = jest.spyOn(controller, 'handleError').mockImplementation();

      await controller.execute();

      expect(handleErrorSpy).toHaveBeenCalledWith(error, 'aulas.list.error');
      handleErrorSpy.mockRestore();
    });
  });

  describe('Static handle method', () => {
    test('deve ser uma função assíncrona', () => {
      expect(GetAulaListController.handle.constructor.name).toBe('AsyncFunction');
    });

    test('deve criar instância e chamar execute', async () => {
      handleServiceMock.mockResolvedValue([]);

      await GetAulaListController.handle(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalled();
    });

    test('deve passar req e res adequadamente', async () => {
      mockReq.query.tipo = 'PARTICULAR';
      handleServiceMock.mockResolvedValue([]);

      await GetAulaListController.handle(mockReq, mockRes);

      expect(handleServiceMock).toHaveBeenCalled();
    });
  });
});
