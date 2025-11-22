import { validateUpdateDisponibilidadeProfessor } from '../../../../src/middlewares/disponibilidade/validateUpdateDisponibilidadeProfessor.js';

describe('validateUpdateDisponibilidadeProfessor middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      body: [],
      t: key => {
        const translations = {
          'validation.noData': 'Nenhum dado fornecido na requisição',
          'validation.error': 'Erro de validação',
          'validation.invalid_format': 'Formato inválido'
        };
        return translations[key] || key;
      }
    };

    mockRes = {
      statusCode: null,
      data: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.data = data;
        return this;
      }
    };

    mockNext = {
      called: false,
      call() {
        this.called = true;
      }
    };
  });

  test('should return 400 when no body provided', () => {
    delete mockReq.body;

    validateUpdateDisponibilidadeProfessor(mockReq, mockRes, () => mockNext.call());

    expect(mockRes.statusCode).toBe(400);
    expect(mockRes.data.message).toBe('Nenhum dado fornecido na requisição');
    expect(mockNext.called).toBe(false);
  });

  test('should return 422 when body is not an array', () => {
    mockReq.body = { not: 'array' };

    validateUpdateDisponibilidadeProfessor(mockReq, mockRes, () => mockNext.call());

    expect(mockRes.statusCode).toBe(422);
    expect(mockRes.data.message).toBe('Erro de validação');
    expect(Array.isArray(mockRes.data.errors)).toBe(true);
    expect(mockNext.called).toBe(false);
  });

  test('should return 422 when horaInicial has invalid format', () => {
    mockReq.body = [
      { diaSemana: 'SEGUNDA', horaInicial: '8:00', horaFinal: '10:00', ativo: true, userId: null }
    ];

    validateUpdateDisponibilidadeProfessor(mockReq, mockRes, () => mockNext.call());

    expect(mockRes.statusCode).toBe(422);
    expect(mockRes.data.message).toBe('Erro de validação');
    expect(mockNext.called).toBe(false);
  });

  test('should return 422 when diaSemana invalid', () => {
    mockReq.body = [
      {
        diaSemana: 'INVALID',
        horaInicial: '08:00',
        horaFinal: '10:00',
        ativo: true,
        userId: null
      }
    ];

    validateUpdateDisponibilidadeProfessor(mockReq, mockRes, () => mockNext.call());

    expect(mockRes.statusCode).toBe(422);
    expect(mockRes.data.message).toBe('Erro de validação');
    expect(mockNext.called).toBe(false);
  });

  test('should call next when payload is valid', () => {
    mockReq.body = [
      {
        diaSemana: 'SEGUNDA',
        horaInicial: '08:00',
        horaFinal: '10:00',
        ativo: true,
        userId: null
      }
    ];

    validateUpdateDisponibilidadeProfessor(mockReq, mockRes, () => mockNext.call());

    expect(mockNext.called).toBe(true);
    expect(mockRes.statusCode).toBe(null);
  });
});
