import { jest } from '@jest/globals';
import { AndamentoAulaController } from '../../../../src/controllers/aula/andamentoAulaController.js';
import { GetAulaService } from '../../../../src/services/aula/getAulaService.js';
import { UpdateAulaService } from '../../../../src/services/aula/updateAulaService.js';

describe('AndamentoAulaController', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      params: { id: 'aula-1' },
      validatedId: 'aula-1',
      body: {},
      user: { id: 'user-1', isAdmin: false },
      t: (key, args) => {
        if (key === 'aulas.andamento.invalid_status_transition' && args) {
          return `Transição de status inválida de '${args.currentStatus}' para '${args.newStatus}'.`;
        }
        const translations = {
          'aulas.andamento.status_required': 'O status da aula é obrigatório.',
          'aulas.get.not_found': 'Aula não encontrada'
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

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('deve retornar 400 se status não for enviado', async () => {
    mockReq.body = {};
    const controller = new AndamentoAulaController(mockReq, mockRes);
    await controller.execute();
    expect(mockRes.statusCode).toBe(400);
    expect(mockRes.data.message).toBe('O status da aula é obrigatório.');
  });

  test('deve retornar 404 se aula não for encontrada', async () => {
    jest.spyOn(GetAulaService, 'handle').mockResolvedValue(null);
    mockReq.body = { status: 'EM_ANDAMENTO' };
    const controller = new AndamentoAulaController(mockReq, mockRes);
    await controller.execute();
    expect(mockRes.statusCode).toBe(404);
    expect(mockRes.data.message).toBe('Aula não encontrada');
  });

  test('deve retornar 200 se status não mudou', async () => {
    jest.spyOn(GetAulaService, 'handle').mockResolvedValue({ status: 'EM_ANDAMENTO' });
    mockReq.body = { status: 'EM_ANDAMENTO' };
    const controller = new AndamentoAulaController(mockReq, mockRes);
    await controller.execute();
    expect(mockRes.statusCode).toBe(200);
  });

  test('deve retornar 422 para transição inválida', async () => {
    jest.spyOn(GetAulaService, 'handle').mockResolvedValue({ status: 'AGENDADA' });
    mockReq.body = { status: 'CONCLUIDA' };
    const controller = new AndamentoAulaController(mockReq, mockRes);
    await controller.execute();
    expect(mockRes.statusCode).toBe(422);
    expect(mockRes.data.message).toContain('Transição de status inválida');
  });

  test('deve atualizar status da aula com sucesso', async () => {
    jest.spyOn(GetAulaService, 'handle').mockResolvedValue({
      status: 'AGENDADA',
      idContrato: 'contrato-1'
    });
    jest.spyOn(UpdateAulaService, 'handle').mockResolvedValue({
      status: 'EM_ANDAMENTO',
      idContrato: 'contrato-1'
    });
    // Mock do UpdateAulasContratoService
    const { UpdateAulasContratoService } = await import(
      '../../../../src/services/contrato/updateAulasContratoService.js'
    );
    jest.spyOn(UpdateAulasContratoService, 'handle').mockResolvedValue({
      id: 'contrato-1',
      totalAulas: 10,
      totalAulasFeitas: 0
    });

    mockReq.body = { status: 'EM_ANDAMENTO' };
    const controller = new AndamentoAulaController(mockReq, mockRes);
    await controller.execute();
    expect(mockRes.statusCode).toBe(200);
    expect(mockRes.data.status).toBe('EM_ANDAMENTO');
  });

  test('deve tratar erro interno', async () => {
    jest.spyOn(GetAulaService, 'handle').mockRejectedValue(new Error('Erro inesperado'));
    mockReq.body = { status: 'EM_ANDAMENTO' };
    const controller = new AndamentoAulaController(mockReq, mockRes);
    const spy = jest
      .spyOn(controller, 'handleError')
      .mockImplementation(() => mockRes.status(500).json({ message: 'Erro interno' }));
    await controller.execute();
    expect(spy).toHaveBeenCalled();
    expect(mockRes.statusCode).toBe(500);
    expect(mockRes.data.message).toBe('Erro interno');
  });
});
