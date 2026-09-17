import { validateAulaListQuery } from '../../../../src/middlewares/aula/validateAulaListQuery.js';
import Constants from '../../../../src/utilities/constants.js';

describe('validateAulaListQuery middleware', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      query: {},
      t: key => {
        const translations = {
          'validation.aula.invalidFilter':
            'Filtro inválido: verifique os valores de tipo, status, dataInicio e dataTermino',
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
      validateAulaListQuery(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBe(null);
    });
  });

  describe('Validação de tipo', () => {
    test('deve chamar next() quando tipo é um valor válido do enum TipoAula', () => {
      mockReq.query = { tipo: 'PADRAO' };

      validateAulaListQuery(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBe(null);
    });

    test('deve retornar 400 quando tipo não é um valor do enum TipoAula', () => {
      mockReq.query = { tipo: 'XYZ' };

      validateAulaListQuery(mockReq, mockRes, callNext);

      expect(mockRes.statusCode).toBe(400);
      expect(mockRes.data.message).toBe(
        'Filtro inválido: verifique os valores de tipo, status, dataInicio e dataTermino'
      );
      expect(mockRes.data.field).toBe('tipo');
      expect(mockNext.called).toBe(false);
    });
  });

  describe('Validação de status', () => {
    test('deve chamar next() quando status é um valor válido do enum StatusAula', () => {
      mockReq.query = { status: 'AGENDADA' };

      validateAulaListQuery(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBe(null);
    });

    test('deve retornar 400 quando status não é um valor do enum StatusAula', () => {
      mockReq.query = { status: 'INVALIDO' };

      validateAulaListQuery(mockReq, mockRes, callNext);

      expect(mockRes.statusCode).toBe(400);
      expect(mockRes.data.field).toBe('status');
      expect(mockNext.called).toBe(false);
    });
  });

  describe('Validação de dataInicio/dataTermino', () => {
    test('deve chamar next() quando dataInicio é uma data válida', () => {
      mockReq.query = { dataInicio: '2025-01-13' };

      validateAulaListQuery(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBe(null);
    });

    test('deve retornar 400 quando dataInicio não é uma data válida', () => {
      mockReq.query = { dataInicio: 'not-a-date' };

      validateAulaListQuery(mockReq, mockRes, callNext);

      expect(mockRes.statusCode).toBe(400);
      expect(mockRes.data.field).toBe('dataInicio');
      expect(mockNext.called).toBe(false);
    });

    test('deve chamar next() quando dataTermino é uma data válida', () => {
      mockReq.query = { dataTermino: '2025-01-20' };

      validateAulaListQuery(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBe(null);
    });

    test('deve retornar 400 quando dataTermino não é uma data válida', () => {
      mockReq.query = { dataTermino: 'not-a-date' };

      validateAulaListQuery(mockReq, mockRes, callNext);

      expect(mockRes.statusCode).toBe(400);
      expect(mockRes.data.field).toBe('dataTermino');
      expect(mockNext.called).toBe(false);
    });

    test.each(['2025-01-15T10:00:00Z', '01/15/2025', 'Jan 15 2025'])(
      'deve retornar 400 quando dataInicio é "%s" (formato que o controller não consegue montar)',
      valorInvalido => {
        mockReq.query = { dataInicio: valorInvalido };

        validateAulaListQuery(mockReq, mockRes, callNext);

        expect(mockRes.statusCode).toBe(400);
        expect(mockRes.data.field).toBe('dataInicio');
        expect(mockNext.called).toBe(false);
      }
    );

    test('deve chamar next() quando dataInicio é "2025-01-15" (formato aceito pelo controller)', () => {
      mockReq.query = { dataInicio: '2025-01-15' };

      validateAulaListQuery(mockReq, mockRes, callNext);

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

      validateAulaListQuery(mockReq, mockRes, callNext);

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

      validateAulaListQuery(mockReq, mockRes, callNext);

      expect(mockRes.statusCode).toBe(500);
      expect(mockRes.data.error).toBe('Erro interno na query');
    });
  });
});
