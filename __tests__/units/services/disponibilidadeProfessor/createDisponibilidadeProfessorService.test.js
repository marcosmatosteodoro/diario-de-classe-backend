import { CreateDisponibilidadeProfessorService } from '../../../../src/services/disponibilidadeProfessor/createDisponibilidadeProfessorService.js';
import AbstractService from '../../../../src/services/abstractService.js';

describe('CreateDisponibilidadeProfessorService', () => {
  test('constructor and instance', () => {
    const Repo = function () {};
    const data = {
      diaDaSemana: 'segunda',
      horaInicial: '08:00',
      horaFinal: '09:00',
      ativo: true,
      userId: 'u1'
    };
    const s = new CreateDisponibilidadeProfessorService(Repo, data);

    expect(s).toBeInstanceOf(CreateDisponibilidadeProfessorService);
    expect(s.data).toBe(data);
    expect(typeof s.execute).toBe('function');
  });

  test('inherits from AbstractService', () => {
    expect(Object.getPrototypeOf(CreateDisponibilidadeProfessorService)).toBe(AbstractService);
  });

  test('handle is async and exists', () => {
    expect(typeof CreateDisponibilidadeProfessorService.handle).toBe('function');
    expect(CreateDisponibilidadeProfessorService.handle.constructor.name).toBe('AsyncFunction');
  });

  test('execute calls repository.create with payload and select and returns result', async () => {
    let calledArgs = null;
    const mockCreate = async (payload, opts) => {
      calledArgs = { payload, opts };
      return { id: 'new1', ...payload };
    };

    const MockRepo = function () {
      this.create = mockCreate;
      this.selectFields = { id: true, diaDaSemana: true };
    };

    const data = {
      diaDaSemana: 'terça',
      horaInicial: '10:00',
      horaFinal: '11:00',
      ativo: false,
      userId: 'u2'
    };
    const s = new CreateDisponibilidadeProfessorService(MockRepo, data);

    const res = await s.execute();

    expect(res).toBeDefined();
    expect(res.id).toBe('new1');
    expect(calledArgs).toBeDefined();
    expect(calledArgs.payload).toEqual({
      diaDaSemana: 'terça',
      horaInicial: '10:00',
      horaFinal: '11:00',
      ativo: false,
      userId: 'u2'
    });
    expect(calledArgs.opts).toEqual({ select: { id: true, diaDaSemana: true } });
  });
});
