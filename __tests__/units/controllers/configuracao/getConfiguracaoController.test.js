import { GetConfiguracaoController } from '../../../../src/controllers/configuracao/getConfiguracaoController.js';
import AbstractController from '../../../../src/controllers/abstractController.js';
import { GetConfiguracaoService } from '../../../../src/services/configuracao/getConfiguracaoService.js';

describe('GetConfiguracaoController', () => {
  function makeRes() {
    const res = {};
    res._status = undefined;
    res._json = undefined;
    res.status = code => {
      res._status = code;
      return res;
    };
    res.json = payload => {
      res._json = payload;
      return res;
    };
    return res;
  }

  test('should instantiate correctly and inherit AbstractController', () => {
    const mockReq = {};
    const mockRes = makeRes();

    const controller = new GetConfiguracaoController(mockReq, mockRes);

    expect(controller).toBeInstanceOf(GetConfiguracaoController);
    expect(controller).toBeInstanceOf(AbstractController);
    expect(controller.req).toBe(mockReq);
    expect(controller.res).toBe(mockRes);
  });

  test('execute should return 204 when no configuracoes', async () => {
    const mockReq = {};
    const mockRes = makeRes();

    // mock service by replacing handle
    const originalHandle = GetConfiguracaoService.handle;
    GetConfiguracaoService.handle = async () => [];

    const controller = new GetConfiguracaoController(mockReq, mockRes);
    await controller.execute();

    // restore
    GetConfiguracaoService.handle = originalHandle;

    expect(mockRes._status).toBe(204);
    expect(mockRes._json).toBeUndefined();
  });

  test('execute should return 200 with first configuracao when present', async () => {
    const mockReq = {};
    const mockRes = makeRes();

    const mockConfigs = [{ id: 'c1', duracaoDaAula: 40 }];

    const originalHandle2 = GetConfiguracaoService.handle;
    GetConfiguracaoService.handle = async () => mockConfigs;

    const controller = new GetConfiguracaoController(mockReq, mockRes);
    await controller.execute();

    GetConfiguracaoService.handle = originalHandle2;

    expect(mockRes._status).toBe(200);
    expect(mockRes._json).toEqual(mockConfigs[0]);
  });

  test('execute should handle errors by calling handleError with translation key', async () => {
    const mockReq = {};
    const mockRes = makeRes();

    const originalHandle3 = GetConfiguracaoService.handle;
    const err = new Error('boom');
    GetConfiguracaoService.handle = async () => {
      throw err;
    };

    const controller = new GetConfiguracaoController(mockReq, mockRes);

    // replace handleError from AbstractController to capture calls
    let receivedErr = null;
    let receivedKey = null;
    controller.handleError = (error, key) => {
      receivedErr = error;
      receivedKey = key;
    };

    await controller.execute();

    expect(receivedErr).toBe(err);
    expect(receivedKey).toBe('configuracaos.list.error');

    GetConfiguracaoService.handle = originalHandle3;
  });

  test('static handle should create controller and call execute', async () => {
    const mockReq = {};
    const mockRes = makeRes();

    const orig = GetConfiguracaoController.prototype.execute;
    let called = false;
    GetConfiguracaoController.prototype.execute = async function () {
      called = true;
    };

    await GetConfiguracaoController.handle(mockReq, mockRes);

    expect(called).toBe(true);

    GetConfiguracaoController.prototype.execute = orig;
  });
});
