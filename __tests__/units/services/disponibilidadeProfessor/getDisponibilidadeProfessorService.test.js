import { GetDisponibilidadeProfessorService } from '../../../../src/services/disponibilidadeProfessor/getDisponibilidadeProfessorService.js';
import AbstractService from '../../../../src/services/abstractService.js';

describe('GetDisponibilidadeProfessorService', () => {
  test('constructor and instance', () => {
    const Repo = function () {};
    const s = new GetDisponibilidadeProfessorService(Repo, 'd1');

    expect(s).toBeInstanceOf(GetDisponibilidadeProfessorService);
    expect(s.id).toBe('d1');
    expect(typeof s.execute).toBe('function');
  });

  test('inherits from AbstractService', () => {
    expect(Object.getPrototypeOf(GetDisponibilidadeProfessorService)).toBe(AbstractService);
  });

  test('handle is async and exists', () => {
    expect(typeof GetDisponibilidadeProfessorService.handle).toBe('function');
    expect(GetDisponibilidadeProfessorService.handle.constructor.name).toBe('AsyncFunction');
  });

  test('execute calls repository.selectOne with selectFields and where', async () => {
    let calledArgs = null;
    const mockSelectOne = async opts => {
      calledArgs = opts;
      return { id: 'd1' };
    };

    const MockRepo = function () {
      this.selectOne = mockSelectOne;
      this.selectFields = { id: true, diaSemana: true };
    };

    const s = new GetDisponibilidadeProfessorService(MockRepo, 'd1');
    const res = await s.execute();

    expect(res).toEqual({ id: 'd1' });
    expect(calledArgs).toBeDefined();
    expect(calledArgs.select).toEqual({ id: true, diaSemana: true });
    expect(calledArgs.where).toEqual({ id: 'd1' });
  });
});
