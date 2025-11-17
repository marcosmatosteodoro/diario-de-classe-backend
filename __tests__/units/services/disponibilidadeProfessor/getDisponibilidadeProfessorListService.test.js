import { GetDisponibilidadeProfessorListService } from '../../../../src/services/disponibilidadeProfessor/getDisponibilidadeProfessorListService.js';
import AbstractService from '../../../../src/services/abstractService.js';

describe('GetDisponibilidadeProfessorListService', () => {
  test('constructor and instance', () => {
    const Repo = function () {};
    const s = new GetDisponibilidadeProfessorListService(Repo, { userId: 'u1' });

    expect(s).toBeInstanceOf(GetDisponibilidadeProfessorListService);
    expect(s.where).toEqual({ userId: 'u1' });
    expect(typeof s.execute).toBe('function');
  });

  test('inherits from AbstractService', () => {
    expect(Object.getPrototypeOf(GetDisponibilidadeProfessorListService)).toBe(AbstractService);
  });

  test('handle is async and exists', () => {
    expect(typeof GetDisponibilidadeProfessorListService.handle).toBe('function');
    expect(GetDisponibilidadeProfessorListService.handle.constructor.name).toBe('AsyncFunction');
  });

  test('execute calls repository.selectMany with selectFields and where', async () => {
    let calledArgs = null;
    const mockSelectMany = async opts => {
      calledArgs = opts;
      return [];
    };

    const MockRepo = function () {
      this.selectMany = mockSelectMany;
      this.selectFields = { id: true };
    };

    const s = new GetDisponibilidadeProfessorListService(MockRepo, { userId: 'u1' });
    await s.execute();

    expect(calledArgs).toBeDefined();
    expect(calledArgs.select).toEqual({ id: true });
    expect(calledArgs.where).toEqual({ userId: 'u1' });
  });
});
