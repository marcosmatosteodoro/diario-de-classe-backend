import { jest } from '@jest/globals';
import { GetHomeController } from '../../../../src/controllers/dashboard/getHome.js';

// Mock services usados pelo controller
import * as alunoService from '../../../../src/services/aluno/getAlunoListService.js';
import * as aulaService from '../../../../src/services/aula/getAulaListService.js';
import * as contratoService from '../../../../src/services/contrato/getContratoListService.js';

describe('GetHomeController', () => {
  let req, res;

  beforeEach(() => {
    req = {
      user: { sub: 42, role: 'admin' },
      query: {}
    };
    res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
    jest.clearAllMocks();
  });

  test('deve retornar estatísticas do dashboard com sucesso', async () => {
    const alunos = [{ id: 1 }, { id: 2 }];
    const aulas = [
      { status: 'AGENDADA', idProfessor: 42 },
      { status: 'EM_ANDAMENTO', idProfessor: 99 },
      { status: 'AGENDADA', idProfessor: 42 },
      { status: 'AGENDADA', idProfessor: 99 }
    ];
    const contratos = [{ id: 1 }, { id: 2 }, { id: 3 }];

    jest.spyOn(alunoService.GetAlunoListService, 'handle').mockResolvedValue(alunos);
    jest.spyOn(aulaService.GetAulaListService, 'handle').mockResolvedValue(aulas);
    jest.spyOn(contratoService.GetContratoListService, 'handle').mockResolvedValue(contratos);

    await GetHomeController.handle(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      totalAulas: 3, // aulasAgendadas
      totalAlunos: 2,
      totalContratos: 3,
      aulas: [
        { status: 'AGENDADA', idProfessor: 42 },
        { status: 'EM_ANDAMENTO', idProfessor: 99 },
        { status: 'AGENDADA', idProfessor: 42 },
        { status: 'AGENDADA', idProfessor: 99 }
      ]
    });
  });

  test('deve lidar com erro e retornar handleError', async () => {
    const error = new Error('Falha');
    jest.spyOn(alunoService.GetAlunoListService, 'handle').mockRejectedValue(error);
    const handleErrorSpy = jest
      .spyOn(GetHomeController.prototype, 'handleError')
      .mockImplementation(function (_err) {
        res.status(500).json({ error: 'dashboard.home.error' });
      });

    await GetHomeController.handle(req, res);

    expect(handleErrorSpy).toHaveBeenCalledWith(error, 'dashboard.home.error');
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'dashboard.home.error' });
  });
});
