import { UpdateDisponibilidadeProfessorService } from '../../../../src/services/disponibilidadeProfessor/updateDisponibilidadeProfessorService.js';
import AbstractService from '../../../../src/services/abstractService.js';

describe('UpdateDisponibilidadeProfessorService', () => {
  test('constructor and instance', () => {
    const Repo = function () {};
    const data = { diaSemana: 'quarta', horaInicial: '12:00' };
    const s = new UpdateDisponibilidadeProfessorService(Repo, 'id1', data);

    expect(s).toBeInstanceOf(UpdateDisponibilidadeProfessorService);
    expect(s.id).toBe('id1');
    expect(s.data).toBe(data);
  });

  test('inherits from AbstractService', () => {
    expect(Object.getPrototypeOf(UpdateDisponibilidadeProfessorService)).toBe(AbstractService);
  });

  test('handle is async and exists', () => {
    expect(typeof UpdateDisponibilidadeProfessorService.handle).toBe('function');
    expect(UpdateDisponibilidadeProfessorService.handle.constructor.name).toBe('AsyncFunction');
  });

  test('execute removes undefined fields and calls repository.update with where and select', async () => {
    let calledArgs = null;
    const mockUpdate = async (where, data, opts) => {
      calledArgs = { where, data, opts };
      return { id: where.id, ...data };
    };

    const MockRepo = function () {
      this.update = mockUpdate;
      this.selectFields = { id: true, diaSemana: true };
    };

    const data = { diaSemana: 'quinta', horaInicial: undefined, horaFinal: '14:00' };
    const s = new UpdateDisponibilidadeProfessorService(MockRepo, 'id2', data);

    const res = await s.execute();

    expect(res).toBeDefined();
    expect(res.id).toBe('id2');
    expect(calledArgs).toBeDefined();
    expect(calledArgs.where).toEqual({ id: 'id2' });
    // horaInicial should be removed because it's undefined
    expect(calledArgs.data).toEqual({ diaSemana: 'quinta', horaFinal: '14:00' });
    expect(calledArgs.opts).toEqual({ select: { id: true, diaSemana: true } });
  });
});
