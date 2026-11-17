import { DeleteContratoController } from '../../../../src/controllers/contrato/deleteContratoController.js';
import { GetContratoService } from '../../../../src/services/contrato/getContratoService.js';
import { DeleteContratoService } from '../../../../src/services/contrato/deleteContratoService.js';
import { GetAulaListService } from '../../../../src/services/aula/getAulaListService.js';

describe('DeleteContratoController', () => {
  let mockReq, mockRes;
  let originalGetHandle, originalDeleteHandle, originalGetAulaListHandle;

  beforeEach(() => {
    mockReq = {
      params: { id: 'contrato-1' },
      t: key => {
        const translations = {
          'contratos.get.not_found': 'Contrato não encontrado',
          'contratos.delete.error': 'Erro ao deletar contrato'
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

    originalGetHandle = GetContratoService.handle;
    originalDeleteHandle = DeleteContratoService.handle;
    originalGetAulaListHandle = GetAulaListService.handle;
  });

  afterEach(() => {
    GetContratoService.handle = originalGetHandle;
    DeleteContratoService.handle = originalDeleteHandle;
    GetAulaListService.handle = originalGetAulaListHandle;
  });

  test('deve retornar 404 quando contrato não existe', async () => {
    GetContratoService.handle = async () => null;
    DeleteContratoService.handle = async () => {
      throw new Error('não deveria ser chamado quando o contrato não existe');
    };

    const controller = new DeleteContratoController(mockReq, mockRes);
    await controller.execute();

    expect(mockRes.statusCode).toBe(404);
    expect(mockRes.data.message).toBe('Contrato não encontrado');
  });

  test('deve deletar e retornar 204 quando contrato existe', async () => {
    let deletedId = null;
    GetContratoService.handle = async id => ({ id });
    DeleteContratoService.handle = async id => {
      deletedId = id;
      return { id };
    };

    const controller = new DeleteContratoController(mockReq, mockRes);
    await controller.execute();

    expect(deletedId).toBe('contrato-1');
    expect(mockRes.statusCode).toBe(204);
  });

  // Comportamento atual: o delete não checa
  // aulas dependentes antes de apagar — hard delete direto, e a cascata do
  // schema arrasta as aulas do contrato, inclusive as CONCLUIDA. Prova que o
  // controller nunca consulta aulas (nenhuma chamada a GetAulaListService)
  // antes de mandar deletar.
  test('não consulta aulas existentes antes de deletar (sem guarda contra aula CONCLUIDA)', async () => {
    let getAulaListCalls = 0;
    GetContratoService.handle = async id => ({ id });
    DeleteContratoService.handle = async id => ({ id });
    GetAulaListService.handle = async () => {
      getAulaListCalls++;
      return [];
    };

    const controller = new DeleteContratoController(mockReq, mockRes);
    await controller.execute();

    expect(getAulaListCalls).toBe(0);
    expect(mockRes.statusCode).toBe(204);
  });

  test('deve tratar erro e retornar 500', async () => {
    GetContratoService.handle = async () => {
      throw new Error('boom');
    };

    const controller = new DeleteContratoController(mockReq, mockRes);
    await controller.execute();

    expect(mockRes.statusCode).toBe(500);
    expect(mockRes.data.message).toBe('Erro ao deletar contrato');
  });

  test('handle estático delega para execute()', async () => {
    GetContratoService.handle = async () => null;

    await DeleteContratoController.handle(mockReq, mockRes);

    expect(mockRes.statusCode).toBe(404);
  });
});
