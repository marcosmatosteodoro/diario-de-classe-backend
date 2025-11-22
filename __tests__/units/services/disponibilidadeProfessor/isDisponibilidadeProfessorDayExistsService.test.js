import { IsDisponibilidadeProfessorDayExistsService } from '../../../../src/services/disponibilidadeProfessor/isDisponibilidadeProfessorDayExistsService.js';
import AbstractService from '../../../../src/services/abstractService.js';

describe('IsDisponibilidadeProfessorDayExistsService', () => {
  test('constructor and instance', () => {
    const Repo = function () {};
    const s = new IsDisponibilidadeProfessorDayExistsService(Repo, 'segunda', 'id1');

    expect(s).toBeInstanceOf(IsDisponibilidadeProfessorDayExistsService);
    expect(s.diaSemana).toBe('segunda');
    expect(s.id).toBe('id1');
    expect(typeof s.execute).toBe('function');
  });

  test('inherits from AbstractService', () => {
    expect(Object.getPrototypeOf(IsDisponibilidadeProfessorDayExistsService)).toBe(AbstractService);
  });

  test('handle is async and exists', () => {
    expect(typeof IsDisponibilidadeProfessorDayExistsService.handle).toBe('function');
    expect(IsDisponibilidadeProfessorDayExistsService.handle.constructor.name).toBe(
      'AsyncFunction'
    );
  });

  test('execute calls repository.selectOne with diaSemana and id and returns boolean', async () => {
    let calledArgs = null;
    const mockSelectOne = async opts => {
      calledArgs = opts;
      return { id: 'id1' };
    };

    const MockRepo = function () {
      this.selectOne = mockSelectOne;
    };

    const s = new IsDisponibilidadeProfessorDayExistsService(MockRepo, 'segunda', 'id1');
    const res = await s.execute();

    expect(res).toBe(true);
    expect(calledArgs).toBeDefined();
    expect(calledArgs.where).toEqual({ diaSemana: 'segunda', id: 'id1' });
    expect(calledArgs.select).toEqual({ id: true });
  });

  test('execute returns false when repository returns null', async () => {
    const MockRepo = function () {
      this.selectOne = async () => null;
    };

    const s = new IsDisponibilidadeProfessorDayExistsService(MockRepo, 'terça', 'id2');
    const res = await s.execute();

    expect(res).toBe(false);
  });
});
