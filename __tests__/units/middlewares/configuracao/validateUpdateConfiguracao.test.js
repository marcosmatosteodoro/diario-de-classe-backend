import { validateUpdateConfiguracao } from '../../../../src/middlewares/configuracao/validateUpdateConfiguracao.js';

describe('validateUpdateConfiguracao middleware', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      body: {},
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

    validateUpdateConfiguracao(mockReq, mockRes, () => mockNext.call());

    expect(mockRes.statusCode).toBe(400);
    expect(mockRes.data.message).toBe('Nenhum dado fornecido na requisição');
    expect(mockNext.called).toBe(false);
  });

  test('should return 422 when diasDeFuncionamento is not an array', () => {
    mockReq.body = { duracaoAula: 45, tolerancia: 5, diasDeFuncionamento: 'not-array' };

    validateUpdateConfiguracao(mockReq, mockRes, () => mockNext.call());

    expect(mockRes.statusCode).toBe(422);
    expect(mockRes.data.message).toBe('Erro de validação');
    expect(Array.isArray(mockRes.data.errors)).toBe(true);
    expect(mockNext.called).toBe(false);
  });

  test('should return 422 when horaInicial has invalid format', () => {
    mockReq.body = {
      duracaoAula: 45,
      tolerancia: 5,
      diasDeFuncionamento: [
        {
          diaSemana: 'SEGUNDA',
          horaInicial: '8:00',
          horaFinal: '10:00',
          ativo: true,
          configuracaoId: null
        }
      ]
    };

    validateUpdateConfiguracao(mockReq, mockRes, () => mockNext.call());

    expect(mockRes.statusCode).toBe(422);
    expect(mockRes.data.message).toBe('Erro de validação');
    expect(mockNext.called).toBe(false);
  });

  test('should call next when payload is valid', () => {
    mockReq.body = {
      duracaoAula: 45,
      tolerancia: 5,
      diasDeFuncionamento: [
        {
          diaSemana: 'SEGUNDA',
          horaInicial: '08:00',
          horaFinal: '10:00',
          ativo: true,
          configuracaoId: null
        }
      ]
    };

    validateUpdateConfiguracao(mockReq, mockRes, () => mockNext.call());

    expect(mockNext.called).toBe(true);
    expect(mockRes.statusCode).toBe(null);
  });
});
