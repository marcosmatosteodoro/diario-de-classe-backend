import { validateLoginParams } from '../../../../src/middlewares/auth/validateLoginParams.js';

describe('validateLoginParams middleware', () => {
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

    validateLoginParams(mockReq, mockRes, () => mockNext.call());

    expect(mockRes.statusCode).toBe(400);
    expect(mockRes.data.message).toBe('Nenhum dado fornecido na requisição');
    expect(mockNext.called).toBe(false);
  });

  test('should return 422 when email is missing', () => {
    mockReq.body = { senha: 'password123' };

    validateLoginParams(mockReq, mockRes, () => mockNext.call());

    expect(mockRes.statusCode).toBe(422);
    expect(mockRes.data.message).toBe('Erro de validação');
    expect(Array.isArray(mockRes.data.errors)).toBe(true);
    expect(mockNext.called).toBe(false);
  });

  test('should return 422 when senha is missing', () => {
    mockReq.body = { email: 'user@example.com' };

    validateLoginParams(mockReq, mockRes, () => mockNext.call());

    expect(mockRes.statusCode).toBe(422);
    expect(mockRes.data.message).toBe('Erro de validação');
    expect(Array.isArray(mockRes.data.errors)).toBe(true);
    expect(mockNext.called).toBe(false);
  });

  test('should return 422 when both email and senha are missing', () => {
    mockReq.body = {};

    validateLoginParams(mockReq, mockRes, () => mockNext.call());

    expect(mockRes.statusCode).toBe(422);
    expect(mockRes.data.message).toBe('Erro de validação');
    expect(Array.isArray(mockRes.data.errors)).toBe(true);
    expect(mockNext.called).toBe(false);
  });

  test('should call next when payload is valid', () => {
    mockReq.body = { email: 'user@example.com', senha: 'password123' };

    validateLoginParams(mockReq, mockRes, () => mockNext.call());

    expect(mockNext.called).toBe(true);
    expect(mockRes.statusCode).toBe(null);
  });

  test('should call next with valid email formats', () => {
    mockReq.body = { email: 'test.user+tag@example.co.uk', senha: 'password123' };

    validateLoginParams(mockReq, mockRes, () => mockNext.call());

    expect(mockNext.called).toBe(true);
    expect(mockRes.statusCode).toBe(null);
  });

  test('should return 422 when email is empty string', () => {
    mockReq.body = { email: '', senha: 'password123' };

    validateLoginParams(mockReq, mockRes, () => mockNext.call());

    expect(mockRes.statusCode).toBe(422);
    expect(mockRes.data.message).toBe('Erro de validação');
    expect(mockNext.called).toBe(false);
  });

  test('should return 422 when senha is empty string', () => {
    mockReq.body = { email: 'user@example.com', senha: '' };

    validateLoginParams(mockReq, mockRes, () => mockNext.call());

    expect(mockRes.statusCode).toBe(422);
    expect(mockRes.data.message).toBe('Erro de validação');
    expect(mockNext.called).toBe(false);
  });

  test('should pass through extra fields', () => {
    mockReq.body = { email: 'user@example.com', senha: 'password123', extra: 'field' };

    validateLoginParams(mockReq, mockRes, () => mockNext.call());

    expect(mockNext.called).toBe(true);
    expect(mockRes.statusCode).toBe(null);
  });

  test('should handle email with whitespace', () => {
    mockReq.body = { email: '  user@example.com  ', senha: 'password123' };

    validateLoginParams(mockReq, mockRes, () => mockNext.call());

    expect(mockNext.called).toBe(true);
    expect(mockRes.statusCode).toBe(null);
  });
});
