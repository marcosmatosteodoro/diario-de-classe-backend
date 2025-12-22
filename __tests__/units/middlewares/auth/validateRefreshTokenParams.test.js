import { validateRefreshTokenParams } from '../../../../src/middlewares/auth/validateRefreshTokenParams.js';

describe('validateRefreshTokenParams middleware', () => {
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

    validateRefreshTokenParams(mockReq, mockRes, () => mockNext.call());

    expect(mockRes.statusCode).toBe(400);
    expect(mockRes.data.message).toBe('Nenhum dado fornecido na requisição');
    expect(mockNext.called).toBe(false);
  });

  test('should return 422 when refreshToken is missing', () => {
    mockReq.body = {};

    validateRefreshTokenParams(mockReq, mockRes, () => mockNext.call());

    expect(mockRes.statusCode).toBe(422);
    expect(mockRes.data.message).toBe('Erro de validação');
    expect(Array.isArray(mockRes.data.errors)).toBe(true);
    expect(mockNext.called).toBe(false);
  });

  test('should return 422 when refreshToken is empty string', () => {
    mockReq.body = { refreshToken: '' };

    validateRefreshTokenParams(mockReq, mockRes, () => mockNext.call());

    expect(mockRes.statusCode).toBe(422);
    expect(mockRes.data.message).toBe('Erro de validação');
    expect(Array.isArray(mockRes.data.errors)).toBe(true);
    expect(mockNext.called).toBe(false);
  });

  test('should return 422 when refreshToken is too short', () => {
    mockReq.body = { refreshToken: 'short' };

    validateRefreshTokenParams(mockReq, mockRes, () => mockNext.call());

    expect(mockRes.statusCode).toBe(422);
    expect(mockRes.data.message).toBe('Erro de validação');
    expect(Array.isArray(mockRes.data.errors)).toBe(true);
    expect(mockNext.called).toBe(false);
  });

  test('should return 422 when refreshToken is too long', () => {
    const longToken = 'a'.repeat(501);
    mockReq.body = { refreshToken: longToken };

    validateRefreshTokenParams(mockReq, mockRes, () => mockNext.call());

    expect(mockRes.statusCode).toBe(422);
    expect(mockRes.data.message).toBe('Erro de validação');
    expect(Array.isArray(mockRes.data.errors)).toBe(true);
    expect(mockNext.called).toBe(false);
  });

  test('should return 422 when refreshToken is not a string', () => {
    mockReq.body = { refreshToken: 12345 };

    validateRefreshTokenParams(mockReq, mockRes, () => mockNext.call());

    expect(mockRes.statusCode).toBe(422);
    expect(mockRes.data.message).toBe('Erro de validação');
    expect(Array.isArray(mockRes.data.errors)).toBe(true);
    expect(mockNext.called).toBe(false);
  });

  test('should call next when refreshToken is valid with minimum length', () => {
    const minValidToken = 'a'.repeat(20);
    mockReq.body = { refreshToken: minValidToken };

    validateRefreshTokenParams(mockReq, mockRes, () => mockNext.call());

    expect(mockNext.called).toBe(true);
    expect(mockRes.statusCode).toBe(null);
  });

  test('should call next when refreshToken is valid with maximum length', () => {
    const maxValidToken = 'a'.repeat(500);
    mockReq.body = { refreshToken: maxValidToken };

    validateRefreshTokenParams(mockReq, mockRes, () => mockNext.call());

    expect(mockNext.called).toBe(true);
    expect(mockRes.statusCode).toBe(null);
  });

  test('should call next when refreshToken is valid JWT-like token', () => {
    const jwtToken =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    mockReq.body = { refreshToken: jwtToken };

    validateRefreshTokenParams(mockReq, mockRes, () => mockNext.call());

    expect(mockNext.called).toBe(true);
    expect(mockRes.statusCode).toBe(null);
  });

  test('should pass through extra fields', () => {
    const validToken = 'a'.repeat(50);
    mockReq.body = { refreshToken: validToken, extra: 'field' };

    validateRefreshTokenParams(mockReq, mockRes, () => mockNext.call());

    expect(mockNext.called).toBe(true);
    expect(mockRes.statusCode).toBe(null);
  });

  test('should handle refreshToken with whitespace', () => {
    const validToken = 'a'.repeat(50);
    mockReq.body = { refreshToken: `  ${validToken}  ` };

    validateRefreshTokenParams(mockReq, mockRes, () => mockNext.call());

    expect(mockNext.called).toBe(true);
    expect(mockRes.statusCode).toBe(null);
  });

  test('should return 422 when refreshToken is null', () => {
    mockReq.body = { refreshToken: null };

    validateRefreshTokenParams(mockReq, mockRes, () => mockNext.call());

    expect(mockRes.statusCode).toBe(422);
    expect(mockRes.data.message).toBe('Erro de validação');
    expect(Array.isArray(mockRes.data.errors)).toBe(true);
    expect(mockNext.called).toBe(false);
  });
});
