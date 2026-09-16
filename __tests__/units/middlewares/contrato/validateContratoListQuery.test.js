import { validateContratoListQuery } from '../../../../src/middlewares/contrato/validateContratoListQuery.js';
import Constants from '../../../../src/utilities/constants.js';

describe('validateContratoListQuery middleware', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      query: {},
      t: key => {
        const translations = {
          'validation.contrato.invalidFilter':
            'Filtro inválido: verifique os valores de idioma, dataInicio e dataTermino',
          'error.internal': 'Erro interno do servidor'
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

  const callNext = () => mockNext.call();

  describe('Filtros ausentes', () => {
    test('deve chamar next() quando nenhum filtro é fornecido', () => {
      validateContratoListQuery(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBe(null);
    });
  });

  describe('Validação de idioma', () => {
    test('deve chamar next() quando idioma é um valor válido do enum Idioma', () => {
      mockReq.query = { idioma: 'INGLES' };

      validateContratoListQuery(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBe(null);
    });

    test('deve retornar 400 quando idioma não é um valor do enum Idioma', () => {
      mockReq.query = { idioma: 'KLINGON' };

      validateContratoListQuery(mockReq, mockRes, callNext);

      expect(mockRes.statusCode).toBe(400);
      expect(mockRes.data.message).toBe(
        'Filtro inválido: verifique os valores de idioma, dataInicio e dataTermino'
      );
      expect(mockRes.data.field).toBe('idioma');
      expect(mockNext.called).toBe(false);
    });
  });

  describe('Validação de dataInicio/dataTermino', () => {
    test('deve chamar next() quando dataInicio é uma data válida', () => {
      mockReq.query = { dataInicio: '2025-01-13' };

      validateContratoListQuery(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBe(null);
    });

    test('deve retornar 400 quando dataInicio não é uma data válida', () => {
      mockReq.query = { dataInicio: 'not-a-date' };

      validateContratoListQuery(mockReq, mockRes, callNext);

      expect(mockRes.statusCode).toBe(400);
      expect(mockRes.data.field).toBe('dataInicio');
      expect(mockNext.called).toBe(false);
    });

    test('deve chamar next() quando dataTermino é uma data válida', () => {
      mockReq.query = { dataTermino: '2025-01-20' };

      validateContratoListQuery(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBe(null);
    });

    test('deve retornar 400 quando dataTermino não é uma data válida', () => {
      mockReq.query = { dataTermino: 'not-a-date' };

      validateContratoListQuery(mockReq, mockRes, callNext);

      expect(mockRes.statusCode).toBe(400);
      expect(mockRes.data.field).toBe('dataTermino');
      expect(mockNext.called).toBe(false);
    });

    test.each(['2025-01-15T10:00:00Z', '01/15/2025', 'Jan 15 2025'])(
      'deve retornar 400 quando dataInicio é "%s" (formato que o controller não consegue montar)',
      valorInvalido => {
        mockReq.query = { dataInicio: valorInvalido };

        validateContratoListQuery(mockReq, mockRes, callNext);

        expect(mockRes.statusCode).toBe(400);
        expect(mockRes.data.field).toBe('dataInicio');
        expect(mockNext.called).toBe(false);
      }
    );

    test('deve chamar next() quando dataInicio é "2025-01-15" (formato aceito pelo controller)', () => {
      mockReq.query = { dataInicio: '2025-01-15' };

      validateContratoListQuery(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBe(null);
    });
  });

  describe('Tratamento de erros', () => {
    const originalEnv = Constants.env;

    afterEach(() => {
      Constants.env = originalEnv;
    });

    test('deve tratar erro interno e retornar 500 sem vazar error.message fora de development', () => {
      Constants.env = 'test';

      Object.defineProperty(mockReq, 'query', {
        get() {
          throw new Error('Erro interno na query');
        }
      });

      validateContratoListQuery(mockReq, mockRes, callNext);

      expect(mockRes.statusCode).toBe(500);
      expect(mockRes.data.message).toBe('Erro interno do servidor');
      expect(mockRes.data.error).toBeUndefined();
      expect(mockNext.called).toBe(false);
    });

    test('deve incluir error.message em development', () => {
      Constants.env = 'development';

      Object.defineProperty(mockReq, 'query', {
        get() {
          throw new Error('Erro interno na query');
        }
      });

      validateContratoListQuery(mockReq, mockRes, callNext);

      expect(mockRes.statusCode).toBe(500);
      expect(mockRes.data.error).toBe('Erro interno na query');
    });
  });
});
