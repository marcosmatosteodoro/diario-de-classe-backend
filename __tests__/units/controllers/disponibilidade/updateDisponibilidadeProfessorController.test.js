import { UpdateDisponibilidadeProfessorController } from '../../../../src/controllers/disponibilidade/updateDisponibilidadeProfessorController.js';
import * as UserService from '../../../../src/services/user/getUserService.js';
import * as GetDispService from '../../../../src/services/disponibilidadeProfessor/getDisponibilidadeProfessorService.js';
import * as CreateService from '../../../../src/services/disponibilidadeProfessor/createDisponibilidadeProfessorService.js';
import * as UpdateService from '../../../../src/services/disponibilidadeProfessor/updateDisponibilidadeProfessorService.js';

describe('UpdateDisponibilidadeProfessorController', () => {
  let req;
  let res;
  let originalUserHandle;
  let originalUpdateHandle;
  let originalGetDispHandle;
  let originalCreateHandle;

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
    if (originalGetDispHandle !== undefined) {
      GetDispService.GetDisponibilidadeProfessorService.handle = originalGetDispHandle;
    }
    if (originalCreateHandle !== undefined) {
      CreateService.CreateDisponibilidadeProfessorService.handle = originalCreateHandle;
    }
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

    originalGetDispHandle = GetDispService.GetDisponibilidadeProfessorService.handle;
    GetDispService.GetDisponibilidadeProfessorService.handle = async id => ({ id, userId: 'u1' });

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

  describe('posse das disponibilidades', () => {
    let writes;

    beforeEach(() => {
      writes = { update: [], create: [] };
      originalUserHandle = UserService.GetUserService.handle;
      UserService.GetUserService.handle = async () => ({ id: 'u1' });
      originalUpdateHandle = UpdateService.UpdateDisponibilidadeProfessorService.handle;
      UpdateService.UpdateDisponibilidadeProfessorService.handle = async (id, data) => {
        writes.update.push([id, data]);
        return { id, ...data };
      };
      originalCreateHandle = CreateService.CreateDisponibilidadeProfessorService.handle;
      CreateService.CreateDisponibilidadeProfessorService.handle = async data => {
        writes.create.push(data);
        return { id: 'novo', ...data };
      };
      originalGetDispHandle = GetDispService.GetDisponibilidadeProfessorService.handle;
      GetDispService.GetDisponibilidadeProfessorService.handle = async id =>
        id === 'd-do-u1' ? { id, userId: 'u1' } : id === 'd-do-u2' ? { id, userId: 'u2' } : null;
    });

    const run = async body => {
      req.body = body;
      await new UpdateDisponibilidadeProfessorController(req, res).execute();
    };

    test('item com userId diferente do professor da rota recusa tudo sem gravar', async () => {
      await run([
        { id: 'd-do-u1', diaSemana: 'seg' },
        { diaSemana: 'ter', userId: 'u2' }
      ]);

      expect(res._status).toBe(403);
      expect(res._json).toEqual({ message: 'disponibilidadeProfessors.update.forbidden' });
      expect(writes).toEqual({ update: [], create: [] });
    });

    test('item com id de disponibilidade de outro professor recusa sem gravar', async () => {
      await run([{ diaSemana: 'seg' }, { id: 'd-do-u2', diaSemana: 'ter' }]);

      expect(res._status).toBe(403);
      expect(writes).toEqual({ update: [], create: [] });
    });

    test('item com id inexistente recusa sem gravar', async () => {
      await run([{ id: 'nao-existe', diaSemana: 'ter' }]);

      expect(res._status).toBe(403);
      expect(writes).toEqual({ update: [], create: [] });
    });

    test('criação grava o userId da rota mesmo sem userId no body', async () => {
      await run([{ diaSemana: 'seg', horaInicial: '08:00' }]);

      expect(res._status).toBe(200);
      expect(writes.create).toEqual([{ diaSemana: 'seg', horaInicial: '08:00', userId: 'u1' }]);
    });

    test('criação com userId null no body grava o userId da rota', async () => {
      await run([{ diaSemana: 'seg', userId: null }]);

      expect(res._status).toBe(200);
      expect(writes.create).toEqual([{ diaSemana: 'seg', userId: 'u1' }]);
    });

    test('criação com userId igual ao da rota e update próprio seguem normalmente', async () => {
      await run([
        { diaSemana: 'seg', userId: 'u1' },
        { id: 'd-do-u1', diaSemana: 'ter' }
      ]);

      expect(res._status).toBe(200);
      expect(writes.create).toEqual([{ diaSemana: 'seg', userId: 'u1' }]);
      expect(writes.update).toEqual([['d-do-u1', { id: 'd-do-u1', diaSemana: 'ter' }]]);
    });
  });
});
