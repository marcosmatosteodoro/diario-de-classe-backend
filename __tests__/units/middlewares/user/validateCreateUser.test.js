import { validateCreateUser } from '../../../../src/middlewares/user/validateCreateUser.js';

describe('validateCreateUser middleware', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      body: {},
      t: key => {
        const translations = {
          'validation.noData': 'Nenhum dado fornecido na requisição',
          'validation.error': 'Erro de validação'
        };
        return translations[key] || key;
      }
    };

    mockRes = {
      statusCode: null,
      data: null,
      status: function (code) {
        this.statusCode = code;
        return this;
      },
      json: function (data) {
        this.data = data;
        return this;
      }
    };

    mockNext = {
      called: false,
      call: function () {
        this.called = true;
      }
    };
  });

  test('should return 400 when no body provided', () => {
    delete mockReq.body;

    validateCreateUser(mockReq, mockRes, () => mockNext.call());

    expect(mockRes.statusCode).toBe(400);
    expect(mockRes.data.message).toBe('Nenhum dado fornecido na requisição');
    expect(mockNext.called).toBe(false);
  });

  test('should return 422 when email invalid', () => {
    mockReq.body = { nome: 'João', sobrenome: 'Silva', email: 'invalid-email', senha: '123456' };

    validateCreateUser(mockReq, mockRes, () => mockNext.call());

    expect(mockRes.statusCode).toBe(422);
    expect(mockRes.data.message).toBe('Erro de validação');
    expect(Array.isArray(mockRes.data.errors)).toBe(true);
    expect(mockNext.called).toBe(false);
  });

  test('should return 422 when nome too short', () => {
    mockReq.body = { nome: 'Jo', sobrenome: 'Silva', email: 'joao@example.com', senha: '123456' };

    validateCreateUser(mockReq, mockRes, () => mockNext.call());

    expect(mockRes.statusCode).toBe(422);
    expect(mockRes.data.message).toBe('Erro de validação');
    expect(mockNext.called).toBe(false);
  });

  test('should call next when payload is valid', () => {
    mockReq.body = { nome: 'João', sobrenome: 'Silva', email: 'joao@example.com', senha: '123456' };

    validateCreateUser(mockReq, mockRes, () => mockNext.call());

    expect(mockNext.called).toBe(true);
    expect(mockRes.statusCode).toBe(null);
  });
});
