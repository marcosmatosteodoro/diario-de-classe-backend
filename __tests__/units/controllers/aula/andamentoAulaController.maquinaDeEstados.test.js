import { jest } from '@jest/globals';
import { AndamentoAulaController } from '../../../../src/controllers/aula/andamentoAulaController.js';
import { GetAulaService } from '../../../../src/services/aula/getAulaService.js';
import { UpdateAulaService } from '../../../../src/services/aula/updateAulaService.js';
import { DeleteAulaService } from '../../../../src/services/aula/deleteAulaService.js';
import { UpdateAulasContratoService } from '../../../../src/services/contrato/updateAulasContratoService.js';

/**
 * Cancelar não apaga —
 * é mudança de `status` pela rota /andamento, e as transições são máquina de
 * estados fechada (status final só migra para outro final, nunca volta a
 * AGENDADA).
 */
describe('AndamentoAulaController — cancelar preserva o registro (não é delete)', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      params: { id: 'aula-1' },
      validatedId: 'aula-1',
      body: {},
      user: { id: 'professor-1', isAdmin: false },
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

  it('cancelar (CANCELADA) chama UpdateAulaService, nunca DeleteAulaService — o registro sobrevive', async () => {
    // A partir de AGENDADA o único destino válido é EM_ANDAMENTO (ver máquina
    // de estados abaixo); para chegar em CANCELADA a aula já precisa estar
    // EM_ANDAMENTO.
    jest.spyOn(GetAulaService, 'handle').mockResolvedValue({
      status: 'EM_ANDAMENTO',
      idContrato: 'contrato-1'
    });
    const updateSpy = jest
      .spyOn(UpdateAulaService, 'handle')
      .mockResolvedValue({ status: 'CANCELADA', idContrato: 'contrato-1' });
    const deleteSpy = jest.spyOn(DeleteAulaService, 'handle');
    jest.spyOn(UpdateAulasContratoService, 'handle').mockResolvedValue({});

    mockReq.body = { status: 'CANCELADA' };
    const controller = new AndamentoAulaController(mockReq, mockRes);
    await controller.execute();

    expect(mockRes.statusCode).toBe(200);
    // Único efeito sobre a aula em si é update de status — nunca delete.
    expect(updateSpy).toHaveBeenCalledWith('aula-1', { status: 'CANCELADA' });
    expect(deleteSpy).not.toHaveBeenCalled();
  });

  it('cancelamento por falta (CANCELADA_POR_FALTA) também é update de status, não delete', async () => {
    jest.spyOn(GetAulaService, 'handle').mockResolvedValue({
      status: 'EM_ANDAMENTO',
      idContrato: 'contrato-1'
    });
    const updateSpy = jest
      .spyOn(UpdateAulaService, 'handle')
      .mockResolvedValue({ status: 'CANCELADA_POR_FALTA', idContrato: 'contrato-1' });
    const deleteSpy = jest.spyOn(DeleteAulaService, 'handle');
    jest.spyOn(UpdateAulasContratoService, 'handle').mockResolvedValue({});

    mockReq.body = { status: 'CANCELADA_POR_FALTA' };
    const controller = new AndamentoAulaController(mockReq, mockRes);
    await controller.execute();

    expect(mockRes.statusCode).toBe(200);
    expect(updateSpy).toHaveBeenCalledWith('aula-1', { status: 'CANCELADA_POR_FALTA' });
    expect(deleteSpy).not.toHaveBeenCalled();
  });
});

describe('AndamentoAulaController — máquina de estados fechada (validateStatusTransition)', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      params: { id: 'aula-1' },
      validatedId: 'aula-1',
      body: {},
      user: { id: 'professor-1', isAdmin: false },
      t: (key, args) => {
        if (key === 'aulas.andamento.invalid_status_transition' && args) {
          return `Transição de status inválida de '${args.currentStatus}' para '${args.newStatus}'.`;
        }
        return key;
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

  it('rejeita voltar de um status final (CONCLUIDA) para AGENDADA', () => {
    const controller = new AndamentoAulaController(
      { ...mockReq, body: { status: 'AGENDADA' } },
      mockRes
    );
    expect(controller.validateStatusTransition('CONCLUIDA', 'AGENDADA')).toBe(false);
  });

  it('rejeita voltar de um status final (CANCELADA) para AGENDADA', () => {
    const controller = new AndamentoAulaController(
      { ...mockReq, body: { status: 'AGENDADA' } },
      mockRes
    );
    expect(controller.validateStatusTransition('CANCELADA', 'AGENDADA')).toBe(false);
  });

  it('rejeita, fim a fim (execute), a transição de CONCLUIDA de volta para AGENDADA', async () => {
    jest.spyOn(GetAulaService, 'handle').mockResolvedValue({
      status: 'CONCLUIDA',
      idContrato: 'contrato-1'
    });
    const updateSpy = jest.spyOn(UpdateAulaService, 'handle');

    mockReq.body = { status: 'AGENDADA' };
    const controller = new AndamentoAulaController(mockReq, mockRes);
    await controller.execute();

    expect(mockRes.statusCode).toBe(422);
    expect(mockRes.data.message).toContain('Transição de status inválida');
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('aceita status final migrar para outro status final (CONCLUIDA -> CANCELADA)', () => {
    const controller = new AndamentoAulaController(
      { ...mockReq, body: { status: 'CANCELADA' } },
      mockRes
    );
    // A régua só veda voltar a AGENDADA; entre finais, a transição passa.
    expect(controller.validateStatusTransition('CONCLUIDA', 'CANCELADA')).toBe(true);
  });

  it('rejeita EM_ANDAMENTO -> AGENDADA (não existe caminho de volta ao agendamento)', () => {
    const controller = new AndamentoAulaController(
      { ...mockReq, body: { status: 'AGENDADA' } },
      mockRes
    );
    expect(controller.validateStatusTransition('EM_ANDAMENTO', 'AGENDADA')).toBe(false);
  });
});
