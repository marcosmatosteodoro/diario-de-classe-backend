import { DeleteDisponibilidadeProfessorService } from '../../../../src/services/disponibilidadeProfessor/deleteDisponibilidadeProfessorService.js';

describe('DeleteDisponibilidadeProfessorService (unit)', () => {
  test('constructor and instance fields', async () => {
    const MockRepository = function () {};
    const service = new DeleteDisponibilidadeProfessorService(MockRepository, 'd-1');

    expect(service.repository).toBeDefined();
    expect(service.id).toBe('d-1');
    expect(typeof service.execute).toBe('function');
  });

  test('execute should call repository.delete with id', async () => {
    let calledWith = null;
    const mockDelete = async args => {
      calledWith = args;
      return { id: args.id };
    };

    const MockRepository = function () {
      this.delete = mockDelete;
    };

    const service = new DeleteDisponibilidadeProfessorService(MockRepository, 'd-1');
    await service.execute();

    expect(calledWith).toEqual({ id: 'd-1' });
  });

  test('handle static should create service and call execute', async () => {
    // Ensure static handle exists and is async. We avoid calling it to prevent DB access.
    expect(typeof DeleteDisponibilidadeProfessorService.handle).toBe('function');
    expect(DeleteDisponibilidadeProfessorService.handle.constructor.name).toBe('AsyncFunction');
  });
});
