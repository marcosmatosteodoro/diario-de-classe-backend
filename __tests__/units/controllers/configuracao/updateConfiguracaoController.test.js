import { UpdateConfiguracaoController } from '../../../../src/controllers/configuracao/updateConfiguracaoController.js';
import AbstractController from '../../../../src/controllers/abstractController.js';
import { GetConfiguracaoService } from '../../../../src/services/configuracao/getConfiguracaoService.js';
import { UpdateConfiguracaoService } from '../../../../src/services/configuracao/updateConfiguracaoService.js';
import { UpdateDiaDeFuncionamentoService } from '../../../../src/services/diaDeFuncionamento/updateDiaDeFuncionamentoService.js';

describe('UpdateConfiguracaoController', () => {
  function makeRes() {
    const res = {};
    res._status = undefined;
    res._json = undefined;
    res.status = function (code) {
      this._status = code;
      return this;
    };
    res.json = function (payload) {
      this._json = payload;
      return this;
    };
    return res;
  }

  test('should instantiate and inherit AbstractController', () => {
    const req = {};
    const res = makeRes();

    const controller = new UpdateConfiguracaoController(req, res);

    expect(controller).toBeInstanceOf(UpdateConfiguracaoController);
    expect(controller).toBeInstanceOf(AbstractController);
    expect(controller.req).toBe(req);
    expect(controller.res).toBe(res);
  });

  test('execute should return 404 when no configuracao exists', async () => {
    const req = { body: {}, t: key => key };
    const res = makeRes();

    const originalGet = GetConfiguracaoService.handle;
    GetConfiguracaoService.handle = async () => [];

    const controller = new UpdateConfiguracaoController(req, res);
    await controller.execute();

    expect(res._status).toBe(404);
    expect(res._json).toEqual({ message: 'configuracaos.get.not_found' });

    GetConfiguracaoService.handle = originalGet;
  });

  test('execute should update dias and configuracao and return 200', async () => {
    const req = {
      body: {
        duracaoDaAula: 50,
        tolerancia: 5,
        diasDeFuncionamento: [
          { id: 'd1', diaDaSemana: 'SEGUNDA', horaInicial: '08:00' },
          { id: 'd2', diaDaSemana: 'TERCA', horaInicial: '08:00' }
        ]
      },
      t: key => key
    };

    const res = makeRes();

    const mockConfig = [{ id: 'cfg1' }];

    const originalGet = GetConfiguracaoService.handle;
    const originalUpdateDia = UpdateDiaDeFuncionamentoService.handle;
    const originalUpdateCfg = UpdateConfiguracaoService.handle;

    const updatedDias = [];
    UpdateDiaDeFuncionamentoService.handle = async (id, data) => {
      updatedDias.push({ id, data });
      return { id, ...data };
    };

    UpdateConfiguracaoService.handle = async (id, data) => ({ id, ...data, updated: true });

    GetConfiguracaoService.handle = async () => mockConfig;

    const controller = new UpdateConfiguracaoController(req, res);
    await controller.execute();

    // verify dias updated
    expect(updatedDias).toHaveLength(2);
    expect(updatedDias[0].id).toBe('d1');
    expect(updatedDias[1].id).toBe('d2');

    // verify configuracao updated and returned
    expect(res._status).toBe(200);
    expect(res._json).toEqual({ id: 'cfg1', duracaoDaAula: 50, tolerancia: 5, updated: true });

    // restore
    GetConfiguracaoService.handle = originalGet;
    UpdateDiaDeFuncionamentoService.handle = originalUpdateDia;
    UpdateConfiguracaoService.handle = originalUpdateCfg;
  });

  test('execute should call handleError on exception with correct key', async () => {
    const req = { body: { diasDeFuncionamento: [] }, t: key => key };
    const res = makeRes();

    const originalGet = GetConfiguracaoService.handle;
    const originalUpdate = UpdateConfiguracaoService.handle;

    // make Get return a config id
    GetConfiguracaoService.handle = async () => [{ id: 'cfg1' }];

    const err = new Error('boom');
    UpdateConfiguracaoService.handle = async () => {
      throw err;
    };

    const controller = new UpdateConfiguracaoController(req, res);

    let receivedErr = null;
    let receivedKey = null;
    controller.handleError = (error, key) => {
      receivedErr = error;
      receivedKey = key;
    };

    await controller.execute();

    expect(receivedErr).toBe(err);
    expect(receivedKey).toBe('configuracaos.update.error');

    GetConfiguracaoService.handle = originalGet;
    UpdateConfiguracaoService.handle = originalUpdate;
  });

  test('static handle should create controller and call execute', async () => {
    const req = { body: {}, t: key => key };
    const res = makeRes();

    const orig = UpdateConfiguracaoController.prototype.execute;
    let called = false;
    UpdateConfiguracaoController.prototype.execute = async function () {
      called = true;
    };

    await UpdateConfiguracaoController.handle(req, res);

    expect(called).toBe(true);

    UpdateConfiguracaoController.prototype.execute = orig;
  });
});
