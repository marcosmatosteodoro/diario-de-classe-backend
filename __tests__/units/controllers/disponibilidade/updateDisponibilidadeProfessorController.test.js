import { UpdateDisponibilidadeProfessorController } from '../../../../src/controllers/disponibilidade/updateDisponibilidadeProfessorController.js';
import * as UserService from '../../../../src/services/user/getUserService.js';
import * as UpdateService from '../../../../src/services/disponibilidadeProfessor/updateDisponibilidadeProfessorService.js';

describe('UpdateDisponibilidadeProfessorController', () => {
  let req;
  let res;
  let originalUserHandle;
  let originalUpdateHandle;

  beforeEach(() => {
    req = { params: { id: 'u1' }, body: [], t: k => k };
    res = {
      status(code) {
        this._status = code;
        return this;
      },
      json(data) {
        this._json = data;
        return this;
      }
    };
  });

  afterEach(() => {
    try {
      if (originalUserHandle !== undefined) {
        UserService.GetUserService.handle = originalUserHandle;
      }
    } catch {
      // ignore restore errors
    }

    try {
      if (originalUpdateHandle !== undefined) {
        UpdateService.UpdateDisponibilidadeProfessorService.handle = originalUpdateHandle;
      }
    } catch {
      // ignore restore errors
    }
  });

  test('returns 404 when user not found', async () => {
    originalUserHandle = UserService.GetUserService.handle;
    UserService.GetUserService.handle = async () => null;

    const controller = new UpdateDisponibilidadeProfessorController(req, res);
    await controller.execute();

    if (res._status !== 404) throw new Error('expected status 404');
    if (JSON.stringify(res._json) !== JSON.stringify({ message: 'users.get.not_found' }))
      throw new Error('expected not_found message');
  });

  test('processes disponibilidades and returns 200 with updated items', async () => {
    originalUserHandle = UserService.GetUserService.handle;
    UserService.GetUserService.handle = async () => ({ id: 'u1' });

    const updates = [
      { id: 'd1', diaSemana: 'seg' },
      { id: 'd2', diaSemana: 'ter' }
    ];

    req.body = updates;

    let callIndex = 0;
    originalUpdateHandle = UpdateService.UpdateDisponibilidadeProfessorService.handle;
    UpdateService.UpdateDisponibilidadeProfessorService.handle = async (id, data) => {
      // echo back an object combining id and data to simulate updated entity
      callIndex += 1;
      return { id, ...data };
    };

    const controller = new UpdateDisponibilidadeProfessorController(req, res);
    await controller.execute();

    if (res._status !== 200) throw new Error('expected status 200');
    if (!Array.isArray(res._json) || res._json.length !== updates.length)
      throw new Error('expected array of updated items');
    if (callIndex !== updates.length)
      throw new Error('expected service.handle called for each disponibilidade');
  });
});
