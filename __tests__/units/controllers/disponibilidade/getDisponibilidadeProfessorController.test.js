import { GetDisponibilidadeProfessorController } from '../../../../src/controllers/disponibilidade/getDisponibilidadeProfessorController.js';
import * as UserService from '../../../../src/services/user/getUserService.js';
import * as DisponibilidadeListService from '../../../../src/services/disponibilidadeProfessor/getDisponibilidadeProfessorListService.js';

describe('GetDisponibilidadeProfessorController', () => {
  let req;
  let res;
  let originalUserHandle;
  let originalListHandle;

  beforeEach(() => {
    req = { params: { id: 'u1' }, t: k => k };
    res = {
      status: function (code) {
        this._status = code;
        return this;
      },
      json: function (data) {
        this._json = data;
        return this;
      }
    };
  });

  afterEach(() => {
    // restore originals if they were replaced
    try {
      if (originalUserHandle !== undefined) {
        UserService.GetUserService.handle = originalUserHandle;
      }
    } catch (e) {
      console.log(e);
      // ignore
    }

    try {
      if (originalListHandle !== undefined) {
        DisponibilidadeListService.GetDisponibilidadeProfessorListService.handle =
          originalListHandle;
      }
    } catch (e) {
      console.log(e);
      // ignore
    }
  });

  test('returns 404 when user not found', async () => {
    // mock GetUserService.handle to return null
    // replace static handle with mock
    originalUserHandle = UserService.GetUserService.handle;
    UserService.GetUserService.handle = async () => null;

    const controller = new GetDisponibilidadeProfessorController(req, res);
    await controller.execute();

    expect(res._status).toBe(404);
    expect(res._json).toEqual({ message: 'users.get.not_found' });
  });

  test('returns 204 when no disponibilidades', async () => {
    // mock user found
    originalUserHandle = UserService.GetUserService.handle;
    UserService.GetUserService.handle = async () => ({ id: 'u1' });

    // mock disponibilidade list returns empty array
    originalListHandle = DisponibilidadeListService.GetDisponibilidadeProfessorListService.handle;
    DisponibilidadeListService.GetDisponibilidadeProfessorListService.handle = async () => [];

    const controller = new GetDisponibilidadeProfessorController(req, res);
    await controller.execute();

    expect(res._status).toBe(204);
    expect(res._json).toBeUndefined();
  });

  test('returns 200 with disponibilidades when present', async () => {
    // mock user found
    originalUserHandle = UserService.GetUserService.handle;
    UserService.GetUserService.handle = async () => ({ id: 'u1' });

    // mock disponibilidade list returns array
    const sample = [{ id: 'd1' }];
    originalListHandle = DisponibilidadeListService.GetDisponibilidadeProfessorListService.handle;
    DisponibilidadeListService.GetDisponibilidadeProfessorListService.handle = async () => sample;

    const controller = new GetDisponibilidadeProfessorController(req, res);
    await controller.execute();

    expect(res._status).toBe(200);
    expect(res._json).toEqual(sample);
  });
});
