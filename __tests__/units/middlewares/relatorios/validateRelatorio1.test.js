import { validateRelatorio1 } from '../../../../src/middlewares/relatorios/validateRelatorio1.js';

describe('validateRelatorio1 middleware', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      query: {},
      t: key => {
        const translations = {
          'relatorios.validate.invalid_dates': 'Datas informadas são inválidas'
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
      callCount: 0,
      call: function () {
        this.called = true;
        this.callCount += 1;
      }
    };
  });

  // Função helper para simular chamada do next
  const callNext = () => mockNext.call();

  describe('Sem filtros de data', () => {
    test('deve chamar next() quando dataInicial e dataFinal estão ausentes', () => {
      validateRelatorio1(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBe(null);
    });

    test('deve chamar next() quando idAluno/idProfessor vêm sem data alguma', () => {
      mockReq.query = { idAluno: 'aluno-1', idProfessor: 'prof-1' };

      validateRelatorio1(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBe(null);
    });
  });

  describe('Datas válidas', () => {
    test('deve chamar next() quando dataInicial e dataFinal são datas válidas', () => {
      mockReq.query = { dataInicial: '2025-01-01', dataFinal: '2025-01-31' };

      validateRelatorio1(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBe(null);
    });

    test('deve chamar next() quando apenas dataInicial é informada e válida', () => {
      mockReq.query = { dataInicial: '2025-05-10' };

      validateRelatorio1(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
    });
  });

  describe('Datas inválidas', () => {
    test('deve retornar 400 quando dataInicial é inválida', () => {
      mockReq.query = { dataInicial: 'not-a-date' };

      validateRelatorio1(mockReq, mockRes, callNext);

      expect(mockRes.statusCode).toBe(400);
      expect(mockRes.data.message).toBe('Datas informadas são inválidas');
      expect(mockRes.data.field).toBe('dataInicial');
      expect(mockNext.called).toBe(false);
    });

    test('deve retornar 400 quando dataFinal é inválida', () => {
      mockReq.query = { dataInicial: '2025-01-01', dataFinal: 'not-a-date' };

      validateRelatorio1(mockReq, mockRes, callNext);

      expect(mockRes.statusCode).toBe(400);
      expect(mockRes.data.field).toBe('dataFinal');
      expect(mockNext.called).toBe(false);
    });

    test('deve usar mensagem padrão quando req.t não existe', () => {
      delete mockReq.t;
      mockReq.query = { dataInicial: 'not-a-date' };

      validateRelatorio1(mockReq, mockRes, callNext);

      expect(mockRes.statusCode).toBe(400);
      expect(mockRes.data.message).toBe('Datas informadas são inválidas');
    });
  });
});
