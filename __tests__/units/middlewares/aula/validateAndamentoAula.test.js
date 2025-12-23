import { jest } from '@jest/globals';
import { validateAndamentoAula } from '../../../../src/middlewares/aula/validateAndamentoAula.js';
import httpStatus from 'http-status';

describe('validateAndamentoAula Middleware', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      body: {},
      t: key => {
        const translations = {
          'validation.is_required': '{field} é obrigatório',
          'validation.must_be_string': '{field} deve ser uma string',
          'validation.must_be_enum': '{field} deve ser um dos valores permitidos'
        };
        return translations[key] || key;
      }
    };
    mockRes = {
      statusCode: null,
      jsonData: null,
      status: function (code) {
        this.statusCode = code;
        return this;
      },
      json: function (data) {
        this.jsonData = data;
        return this;
      }
    };
    mockNext = jest.fn();
  });

  test('deve passar para o próximo middleware se status for válido', () => {
    mockReq.body = { status: 'EM_ANDAMENTO' };
    validateAndamentoAula(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  test('deve aceitar status opcional (não enviado)', () => {
    mockReq.body = {};
    validateAndamentoAula(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  test('deve retornar erro se status for inválido', () => {
    mockReq.body = { status: 'INVALIDO' };
    validateAndamentoAula(mockReq, mockRes, mockNext);
    expect(mockRes.statusCode).toBe(httpStatus.UNPROCESSABLE_ENTITY);
    expect(mockRes.jsonData).toBeDefined();
    expect(mockRes.jsonData.errors).toBeDefined();
    expect(mockRes.jsonData.errors[0]).toContain('status');
  });

  test('deve retornar erro se status não for string', () => {
    mockReq.body = { status: 123 };
    validateAndamentoAula(mockReq, mockRes, mockNext);
    expect(mockRes.statusCode).toBe(httpStatus.UNPROCESSABLE_ENTITY);
    expect(mockRes.jsonData.errors[0]).toContain('status');
  });
});
