import { jest } from '@jest/globals';
import XLSX from 'xlsx';
import { GetRelatorio1Controller } from '../../../../src/controllers/relatorios/getRelatorio1Controller.js';
import { GetAlunoListService } from '../../../../src/services/aluno/getAlunoListService.js';
import AbstractController from '../../../../src/controllers/abstractController.js';

jest.mock('../../../../src/services/aluno/getAlunoListService.js');

/**
 * Decodifica o buffer .xlsx enviado por `res.send` e devolve as linhas da
 * planilha "Alunos" como array de objetos simples.
 */
const readAlunosSheet = buffer => {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  return XLSX.utils.sheet_to_json(workbook.Sheets.Alunos);
};

describe('GetRelatorio1Controller', () => {
  let mockReq, mockRes;
  let handleServiceMock;

  const criarReq = query => ({ query, t: key => key });

  beforeEach(() => {
    mockReq = criarReq({});

    mockRes = {
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    handleServiceMock = jest.fn().mockResolvedValue([]);
    GetAlunoListService.handle = handleServiceMock;
  });

  test('deve herdar de AbstractController', () => {
    const controller = new GetRelatorio1Controller(mockReq, mockRes);
    expect(controller).toBeInstanceOf(AbstractController);
  });

  describe('buildWhere', () => {
    test('sem nenhum filtro, retorna where vazio', () => {
      const controller = new GetRelatorio1Controller(mockReq, mockRes);
      expect(controller.buildWhere({})).toEqual({});
    });

    test('com idAluno, restringe pelo id exato do aluno', () => {
      const controller = new GetRelatorio1Controller(mockReq, mockRes);
      expect(controller.buildWhere({ idAluno: 'aluno-1' })).toEqual({ id: 'aluno-1' });
    });

    test('com idProfessor, restringe a alunos com aula desse professor', () => {
      const controller = new GetRelatorio1Controller(mockReq, mockRes);
      expect(controller.buildWhere({ idProfessor: 'prof-1' })).toEqual({
        aulas: { some: { idProfessor: 'prof-1' } }
      });
    });

    test('com dataInicial e dataFinal, restringe pelo intervalo de dataAula', () => {
      const controller = new GetRelatorio1Controller(mockReq, mockRes);
      const where = controller.buildWhere({
        dataInicial: '2025-01-01',
        dataFinal: '2025-01-31'
      });

      expect(where).toEqual({
        aulas: {
          some: {
            dataAula: {
              gte: new Date('2025-01-01'),
              lte: new Date('2025-01-31')
            }
          }
        }
      });
    });

    test('combina idProfessor com datas no mesmo aulas.some', () => {
      const controller = new GetRelatorio1Controller(mockReq, mockRes);
      const where = controller.buildWhere({
        idProfessor: 'prof-1',
        dataInicial: '2025-01-01'
      });

      expect(where).toEqual({
        aulas: {
          some: {
            idProfessor: 'prof-1',
            dataAula: { gte: new Date('2025-01-01') }
          }
        }
      });
    });

    test('combina idAluno com filtro de aulas (AND implícito de chaves distintas)', () => {
      const controller = new GetRelatorio1Controller(mockReq, mockRes);
      const where = controller.buildWhere({ idAluno: 'aluno-1', idProfessor: 'prof-1' });

      expect(where).toEqual({
        id: 'aluno-1',
        aulas: { some: { idProfessor: 'prof-1' } }
      });
    });
  });

  describe('execute', () => {
    test('sem filtro nenhum, chama GetAlunoListService.handle com where vazio (comportamento atual preservado)', async () => {
      const controller = new GetRelatorio1Controller(mockReq, mockRes);
      await controller.execute();

      expect(handleServiceMock).toHaveBeenCalledWith({});
    });

    test('com idAluno na query, chama o service com where.id igual ao idAluno', async () => {
      mockReq.query.idAluno = 'aluno-42';
      const controller = new GetRelatorio1Controller(mockReq, mockRes);
      await controller.execute();

      expect(handleServiceMock).toHaveBeenCalledWith({ id: 'aluno-42' });
    });

    test('com idProfessor e datas na query, chama o service com where.aulas.some refletindo os critérios', async () => {
      mockReq.query.idProfessor = 'prof-99';
      mockReq.query.dataInicial = '2025-02-01';
      mockReq.query.dataFinal = '2025-02-28';
      const controller = new GetRelatorio1Controller(mockReq, mockRes);
      await controller.execute();

      expect(handleServiceMock).toHaveBeenCalledWith({
        aulas: {
          some: {
            idProfessor: 'prof-99',
            dataAula: {
              gte: new Date('2025-02-01'),
              lte: new Date('2025-02-28')
            }
          }
        }
      });
    });

    test('gera o Excel apenas com id/nome dos alunos retornados pelo service', async () => {
      handleServiceMock.mockResolvedValue([
        { id: '1', nome: 'Ana', email: 'ana@escola.com' },
        { id: '2', nome: 'Bruno', email: 'bruno@escola.com' }
      ]);

      const controller = new GetRelatorio1Controller(mockReq, mockRes);
      await controller.execute();

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const buffer = mockRes.send.mock.calls[0][0];
      expect(readAlunosSheet(buffer)).toEqual([
        { id: '1', nome: 'Ana' },
        { id: '2', nome: 'Bruno' }
      ]);
    });

    test('filtro de aluno específico restringe o conteúdo do relatório frente ao sem filtro', async () => {
      // Sem filtro: service devolve todos os alunos
      handleServiceMock.mockResolvedValueOnce([
        { id: '1', nome: 'Ana' },
        { id: '2', nome: 'Bruno' }
      ]);
      const controllerSemFiltro = new GetRelatorio1Controller(criarReq({}), mockRes);
      await controllerSemFiltro.execute();
      const alunosSemFiltro = readAlunosSheet(mockRes.send.mock.calls[0][0]);

      // Com filtro de aluno: service (mockado) devolve só o aluno filtrado
      handleServiceMock.mockResolvedValueOnce([{ id: '1', nome: 'Ana' }]);
      const controllerComFiltro = new GetRelatorio1Controller(criarReq({ idAluno: '1' }), mockRes);
      await controllerComFiltro.execute();
      const alunosComFiltro = readAlunosSheet(mockRes.send.mock.calls[1][0]);

      expect(alunosSemFiltro).toEqual([
        { id: '1', nome: 'Ana' },
        { id: '2', nome: 'Bruno' }
      ]);
      expect(alunosComFiltro).toEqual([{ id: '1', nome: 'Ana' }]);
      expect(alunosComFiltro).not.toEqual(alunosSemFiltro);
      expect(handleServiceMock).toHaveBeenNthCalledWith(2, { id: '1' });
    });

    test('deve tratar erros e chamar handleError', async () => {
      const error = new Error('Database error');
      handleServiceMock.mockRejectedValue(error);

      const controller = new GetRelatorio1Controller(mockReq, mockRes);
      const handleErrorSpy = jest.spyOn(controller, 'handleError').mockImplementation();

      await controller.execute();

      expect(handleErrorSpy).toHaveBeenCalledWith(error, 'configuracaos.list.error');
      handleErrorSpy.mockRestore();
    });
  });

  describe('static handle', () => {
    test('cria a instância e chama execute', async () => {
      await GetRelatorio1Controller.handle(mockReq, mockRes);
      expect(handleServiceMock).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });
});
