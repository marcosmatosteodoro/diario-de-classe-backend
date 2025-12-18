import { validateGenerateAula } from '../../../../src/middlewares/aula/validateGenerateAula.js';
import httpStatus from 'http-status';

describe('validateGenerateAula Middleware', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      body: {
        dataInicio: '2025-01-06',
        dataFim: '2025-01-31',
        diasAulas: [
          { diaSemana: 'SEGUNDA', horaInicial: '08:00', horaFinal: '10:00' },
          { diaSemana: 'QUARTA', horaInicial: '14:00', horaFinal: '16:00' }
        ]
      },
      t: key => {
        const translations = {
          'validation.is_required': '{field} é obrigatório',
          'validation.must_be_string': '{field} deve ser uma string',
          'validation.must_be_date': '{field} deve ser uma data válida',
          'validation.must_be_array': '{field} deve ser um array'
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

    mockNext = () => {
      mockNext.called = true;
    };
    mockNext.called = false;
  });

  describe('Estrutura do middleware', () => {
    test('deve ser uma função', () => {
      expect(typeof validateGenerateAula).toBe('function');
    });

    test('deve aceitar 3 parâmetros (req, res, next)', () => {
      expect(validateGenerateAula.length).toBe(3);
    });
  });

  describe('Validações de campos obrigatórios', () => {
    test('deve aceitar dados válidos', () => {
      validateGenerateAula(mockReq, mockRes, mockNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });

    test('deve rejeitar quando dataInicio está ausente', () => {
      delete mockReq.body.dataInicio;

      validateGenerateAula(mockReq, mockRes, mockNext);

      expect(mockRes.statusCode).toBe(httpStatus.UNPROCESSABLE_ENTITY);
      expect(mockNext.called).toBe(false);
    });

    test('deve rejeitar quando dataFim está ausente', () => {
      delete mockReq.body.dataFim;

      validateGenerateAula(mockReq, mockRes, mockNext);

      expect(mockRes.statusCode).toBe(httpStatus.UNPROCESSABLE_ENTITY);
      expect(mockNext.called).toBe(false);
    });

    test('deve rejeitar quando diasAulas está ausente', () => {
      delete mockReq.body.diasAulas;

      validateGenerateAula(mockReq, mockRes, mockNext);

      expect(mockRes.statusCode).toBe(httpStatus.UNPROCESSABLE_ENTITY);
      expect(mockNext.called).toBe(false);
    });

    test('deve rejeitar quando todos os campos estão ausentes', () => {
      mockReq.body = {};

      validateGenerateAula(mockReq, mockRes, mockNext);

      expect(mockRes.statusCode).toBe(httpStatus.UNPROCESSABLE_ENTITY);
      expect(mockNext.called).toBe(false);
    });
  });

  describe('Validações de tipo de dataInicio', () => {
    test('deve aceitar dataInicio como string de data válida', () => {
      mockReq.body.dataInicio = '2025-01-15';

      validateGenerateAula(mockReq, mockRes, mockNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });

    test('deve rejeitar dataInicio que não é string', () => {
      mockReq.body.dataInicio = 12345;

      validateGenerateAula(mockReq, mockRes, mockNext);

      expect(mockRes.statusCode).toBe(httpStatus.UNPROCESSABLE_ENTITY);
      expect(mockNext.called).toBe(false);
    });

    test('deve rejeitar dataInicio com formato de data inválido', () => {
      mockReq.body.dataInicio = 'data-invalida';

      validateGenerateAula(mockReq, mockRes, mockNext);

      expect(mockRes.statusCode).toBe(httpStatus.UNPROCESSABLE_ENTITY);
      expect(mockNext.called).toBe(false);
    });

    test('deve rejeitar dataInicio null', () => {
      mockReq.body.dataInicio = null;

      validateGenerateAula(mockReq, mockRes, mockNext);

      expect(mockRes.statusCode).toBe(httpStatus.UNPROCESSABLE_ENTITY);
      expect(mockNext.called).toBe(false);
    });

    test('deve rejeitar dataInicio vazio', () => {
      mockReq.body.dataInicio = '';

      validateGenerateAula(mockReq, mockRes, mockNext);

      expect(mockRes.statusCode).toBe(httpStatus.UNPROCESSABLE_ENTITY);
      expect(mockNext.called).toBe(false);
    });
  });

  describe('Validações de tipo de dataFim', () => {
    test('deve aceitar dataFim como string de data válida', () => {
      mockReq.body.dataFim = '2025-02-28';

      validateGenerateAula(mockReq, mockRes, mockNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });

    test('deve rejeitar dataFim que não é string', () => {
      mockReq.body.dataFim = 67890;

      validateGenerateAula(mockReq, mockRes, mockNext);

      expect(mockRes.statusCode).toBe(httpStatus.UNPROCESSABLE_ENTITY);
      expect(mockNext.called).toBe(false);
    });

    test('deve rejeitar dataFim com formato de data inválido', () => {
      mockReq.body.dataFim = 'fim-invalido';

      validateGenerateAula(mockReq, mockRes, mockNext);

      expect(mockRes.statusCode).toBe(httpStatus.UNPROCESSABLE_ENTITY);
      expect(mockNext.called).toBe(false);
    });

    test('deve rejeitar dataFim null', () => {
      mockReq.body.dataFim = null;

      validateGenerateAula(mockReq, mockRes, mockNext);

      expect(mockRes.statusCode).toBe(httpStatus.UNPROCESSABLE_ENTITY);
      expect(mockNext.called).toBe(false);
    });

    test('deve rejeitar dataFim vazio', () => {
      mockReq.body.dataFim = '';

      validateGenerateAula(mockReq, mockRes, mockNext);

      expect(mockRes.statusCode).toBe(httpStatus.UNPROCESSABLE_ENTITY);
      expect(mockNext.called).toBe(false);
    });
  });

  describe('Validação de dataFim posterior a dataInicio', () => {
    test('deve aceitar quando dataFim é posterior a dataInicio', () => {
      mockReq.body.dataInicio = '2025-01-01';
      mockReq.body.dataFim = '2025-01-31';

      validateGenerateAula(mockReq, mockRes, mockNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });

    test('deve rejeitar quando dataFim é anterior a dataInicio', () => {
      mockReq.body.dataInicio = '2025-01-31';
      mockReq.body.dataFim = '2025-01-01';

      validateGenerateAula(mockReq, mockRes, mockNext);

      expect(mockRes.statusCode).toBe(httpStatus.UNPROCESSABLE_ENTITY);
      expect(mockNext.called).toBe(false);
    });

    test('deve rejeitar quando dataFim é igual a dataInicio', () => {
      mockReq.body.dataInicio = '2025-01-15';
      mockReq.body.dataFim = '2025-01-15';

      validateGenerateAula(mockReq, mockRes, mockNext);

      expect(mockRes.statusCode).toBe(httpStatus.UNPROCESSABLE_ENTITY);
      expect(mockNext.called).toBe(false);
    });

    test('deve aceitar dataFim um dia após dataInicio', () => {
      mockReq.body.dataInicio = '2025-01-15';
      mockReq.body.dataFim = '2025-01-16';

      validateGenerateAula(mockReq, mockRes, mockNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });

    test('deve aceitar diferença de vários meses', () => {
      mockReq.body.dataInicio = '2025-01-01';
      mockReq.body.dataFim = '2025-12-31';

      validateGenerateAula(mockReq, mockRes, mockNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });
  });

  describe('Validações de diasAulas', () => {
    test('deve aceitar array válido de diasAulas', () => {
      mockReq.body.diasAulas = [
        { diaSemana: 'SEGUNDA', horaInicial: '08:00', horaFinal: '10:00' },
        { diaSemana: 'QUARTA', horaInicial: '14:00', horaFinal: '16:00' }
      ];

      validateGenerateAula(mockReq, mockRes, mockNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });

    test('deve rejeitar diasAulas que não é array', () => {
      mockReq.body.diasAulas = 'não é array';

      validateGenerateAula(mockReq, mockRes, mockNext);

      expect(mockRes.statusCode).toBe(httpStatus.UNPROCESSABLE_ENTITY);
      expect(mockNext.called).toBe(false);
    });

    test('deve rejeitar diasAulas como array vazio', () => {
      mockReq.body.diasAulas = [];

      validateGenerateAula(mockReq, mockRes, mockNext);

      expect(mockRes.statusCode).toBe(httpStatus.UNPROCESSABLE_ENTITY);
      expect(mockNext.called).toBe(false);
    });

    test('deve rejeitar diasAulas null', () => {
      mockReq.body.diasAulas = null;

      validateGenerateAula(mockReq, mockRes, mockNext);

      expect(mockRes.statusCode).toBe(httpStatus.UNPROCESSABLE_ENTITY);
      expect(mockNext.called).toBe(false);
    });

    test('deve aceitar um único dia da semana', () => {
      mockReq.body.diasAulas = [{ diaSemana: 'SEXTA', horaInicial: '09:00', horaFinal: '11:00' }];

      validateGenerateAula(mockReq, mockRes, mockNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });

    test('deve aceitar todos os dias da semana', () => {
      mockReq.body.diasAulas = [
        { diaSemana: 'SEGUNDA', horaInicial: '08:00', horaFinal: '10:00' },
        { diaSemana: 'TERCA', horaInicial: '08:00', horaFinal: '10:00' },
        { diaSemana: 'QUARTA', horaInicial: '08:00', horaFinal: '10:00' },
        { diaSemana: 'QUINTA', horaInicial: '08:00', horaFinal: '10:00' },
        { diaSemana: 'SEXTA', horaInicial: '08:00', horaFinal: '10:00' },
        { diaSemana: 'SABADO', horaInicial: '08:00', horaFinal: '10:00' },
        { diaSemana: 'DOMINGO', horaInicial: '08:00', horaFinal: '10:00' }
      ];

      validateGenerateAula(mockReq, mockRes, mockNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });
  });

  describe('Validações de diaSemana em diasAulas', () => {
    test('deve aceitar SEGUNDA como diaSemana', () => {
      mockReq.body.diasAulas = [{ diaSemana: 'SEGUNDA', horaInicial: '08:00', horaFinal: '10:00' }];

      validateGenerateAula(mockReq, mockRes, mockNext);

      expect(mockNext.called).toBe(true);
    });

    test('deve aceitar TERCA como diaSemana', () => {
      mockReq.body.diasAulas = [{ diaSemana: 'TERCA', horaInicial: '08:00', horaFinal: '10:00' }];

      validateGenerateAula(mockReq, mockRes, mockNext);

      expect(mockNext.called).toBe(true);
    });

    test('deve aceitar QUARTA como diaSemana', () => {
      mockReq.body.diasAulas = [{ diaSemana: 'QUARTA', horaInicial: '08:00', horaFinal: '10:00' }];

      validateGenerateAula(mockReq, mockRes, mockNext);

      expect(mockNext.called).toBe(true);
    });

    test('deve aceitar QUINTA como diaSemana', () => {
      mockReq.body.diasAulas = [{ diaSemana: 'QUINTA', horaInicial: '08:00', horaFinal: '10:00' }];

      validateGenerateAula(mockReq, mockRes, mockNext);

      expect(mockNext.called).toBe(true);
    });

    test('deve aceitar SEXTA como diaSemana', () => {
      mockReq.body.diasAulas = [{ diaSemana: 'SEXTA', horaInicial: '08:00', horaFinal: '10:00' }];

      validateGenerateAula(mockReq, mockRes, mockNext);

      expect(mockNext.called).toBe(true);
    });

    test('deve aceitar SABADO como diaSemana', () => {
      mockReq.body.diasAulas = [{ diaSemana: 'SABADO', horaInicial: '08:00', horaFinal: '10:00' }];

      validateGenerateAula(mockReq, mockRes, mockNext);

      expect(mockNext.called).toBe(true);
    });

    test('deve aceitar DOMINGO como diaSemana', () => {
      mockReq.body.diasAulas = [{ diaSemana: 'DOMINGO', horaInicial: '08:00', horaFinal: '10:00' }];

      validateGenerateAula(mockReq, mockRes, mockNext);

      expect(mockNext.called).toBe(true);
    });

    test('deve rejeitar diaSemana ausente', () => {
      mockReq.body.diasAulas = [{ horaInicial: '08:00', horaFinal: '10:00' }];

      validateGenerateAula(mockReq, mockRes, mockNext);

      expect(mockRes.statusCode).toBe(httpStatus.UNPROCESSABLE_ENTITY);
      expect(mockNext.called).toBe(false);
    });

    test('deve rejeitar diaSemana inválido', () => {
      mockReq.body.diasAulas = [
        { diaSemana: 'INVALIDDAY', horaInicial: '08:00', horaFinal: '10:00' }
      ];

      validateGenerateAula(mockReq, mockRes, mockNext);

      expect(mockRes.statusCode).toBe(httpStatus.UNPROCESSABLE_ENTITY);
      expect(mockNext.called).toBe(false);
    });

    test('deve rejeitar diaSemana em minúsculas', () => {
      mockReq.body.diasAulas = [{ diaSemana: 'segunda', horaInicial: '08:00', horaFinal: '10:00' }];

      validateGenerateAula(mockReq, mockRes, mockNext);

      expect(mockRes.statusCode).toBe(httpStatus.UNPROCESSABLE_ENTITY);
      expect(mockNext.called).toBe(false);
    });

    test('deve rejeitar diaSemana null', () => {
      mockReq.body.diasAulas = [{ diaSemana: null, horaInicial: '08:00', horaFinal: '10:00' }];

      validateGenerateAula(mockReq, mockRes, mockNext);

      expect(mockRes.statusCode).toBe(httpStatus.UNPROCESSABLE_ENTITY);
      expect(mockNext.called).toBe(false);
    });

    test('deve rejeitar diaSemana vazio', () => {
      mockReq.body.diasAulas = [{ diaSemana: '', horaInicial: '08:00', horaFinal: '10:00' }];

      validateGenerateAula(mockReq, mockRes, mockNext);

      expect(mockRes.statusCode).toBe(httpStatus.UNPROCESSABLE_ENTITY);
      expect(mockNext.called).toBe(false);
    });
  });

  describe('Validações de horaInicial em diasAulas', () => {
    test('deve aceitar horaInicial em formato HH:MM', () => {
      mockReq.body.diasAulas = [{ diaSemana: 'SEGUNDA', horaInicial: '08:00', horaFinal: '10:00' }];

      validateGenerateAula(mockReq, mockRes, mockNext);

      expect(mockNext.called).toBe(true);
    });

    test('deve rejeitar horaInicial ausente', () => {
      mockReq.body.diasAulas = [{ diaSemana: 'SEGUNDA', horaFinal: '10:00' }];

      validateGenerateAula(mockReq, mockRes, mockNext);

      expect(mockRes.statusCode).toBe(httpStatus.UNPROCESSABLE_ENTITY);
      expect(mockNext.called).toBe(false);
    });

    test('deve rejeitar horaInicial que não é string', () => {
      mockReq.body.diasAulas = [{ diaSemana: 'SEGUNDA', horaInicial: 800, horaFinal: '10:00' }];

      validateGenerateAula(mockReq, mockRes, mockNext);

      expect(mockRes.statusCode).toBe(httpStatus.UNPROCESSABLE_ENTITY);
      expect(mockNext.called).toBe(false);
    });

    test('deve rejeitar horaInicial com comprimento diferente de 5', () => {
      mockReq.body.diasAulas = [{ diaSemana: 'SEGUNDA', horaInicial: '8:00', horaFinal: '10:00' }];

      validateGenerateAula(mockReq, mockRes, mockNext);

      expect(mockRes.statusCode).toBe(httpStatus.UNPROCESSABLE_ENTITY);
      expect(mockNext.called).toBe(false);
    });

    test('deve rejeitar horaInicial null', () => {
      mockReq.body.diasAulas = [{ diaSemana: 'SEGUNDA', horaInicial: null, horaFinal: '10:00' }];

      validateGenerateAula(mockReq, mockRes, mockNext);

      expect(mockRes.statusCode).toBe(httpStatus.UNPROCESSABLE_ENTITY);
      expect(mockNext.called).toBe(false);
    });

    test('deve rejeitar horaInicial vazio', () => {
      mockReq.body.diasAulas = [{ diaSemana: 'SEGUNDA', horaInicial: '', horaFinal: '10:00' }];

      validateGenerateAula(mockReq, mockRes, mockNext);

      expect(mockRes.statusCode).toBe(httpStatus.UNPROCESSABLE_ENTITY);
      expect(mockNext.called).toBe(false);
    });

    test('deve aceitar diferentes formatos de hora válidos', () => {
      mockReq.body.diasAulas = [
        { diaSemana: 'SEGUNDA', horaInicial: '07:30', horaFinal: '09:45' },
        { diaSemana: 'QUARTA', horaInicial: '13:15', horaFinal: '15:20' }
      ];

      validateGenerateAula(mockReq, mockRes, mockNext);

      expect(mockNext.called).toBe(true);
    });
  });

  describe('Validações de horaFinal em diasAulas', () => {
    test('deve aceitar horaFinal em formato HH:MM', () => {
      mockReq.body.diasAulas = [{ diaSemana: 'SEGUNDA', horaInicial: '08:00', horaFinal: '10:00' }];

      validateGenerateAula(mockReq, mockRes, mockNext);

      expect(mockNext.called).toBe(true);
    });

    test('deve rejeitar horaFinal ausente', () => {
      mockReq.body.diasAulas = [{ diaSemana: 'SEGUNDA', horaInicial: '08:00' }];

      validateGenerateAula(mockReq, mockRes, mockNext);

      expect(mockRes.statusCode).toBe(httpStatus.UNPROCESSABLE_ENTITY);
      expect(mockNext.called).toBe(false);
    });

    test('deve rejeitar horaFinal que não é string', () => {
      mockReq.body.diasAulas = [{ diaSemana: 'SEGUNDA', horaInicial: '08:00', horaFinal: 1000 }];

      validateGenerateAula(mockReq, mockRes, mockNext);

      expect(mockRes.statusCode).toBe(httpStatus.UNPROCESSABLE_ENTITY);
      expect(mockNext.called).toBe(false);
    });

    test('deve rejeitar horaFinal com comprimento diferente de 5', () => {
      mockReq.body.diasAulas = [{ diaSemana: 'SEGUNDA', horaInicial: '08:00', horaFinal: '10:0' }];

      validateGenerateAula(mockReq, mockRes, mockNext);

      expect(mockRes.statusCode).toBe(httpStatus.UNPROCESSABLE_ENTITY);
      expect(mockNext.called).toBe(false);
    });

    test('deve rejeitar horaFinal null', () => {
      mockReq.body.diasAulas = [{ diaSemana: 'SEGUNDA', horaInicial: '08:00', horaFinal: null }];

      validateGenerateAula(mockReq, mockRes, mockNext);

      expect(mockRes.statusCode).toBe(httpStatus.UNPROCESSABLE_ENTITY);
      expect(mockNext.called).toBe(false);
    });

    test('deve rejeitar horaFinal vazio', () => {
      mockReq.body.diasAulas = [{ diaSemana: 'SEGUNDA', horaInicial: '08:00', horaFinal: '' }];

      validateGenerateAula(mockReq, mockRes, mockNext);

      expect(mockRes.statusCode).toBe(httpStatus.UNPROCESSABLE_ENTITY);
      expect(mockNext.called).toBe(false);
    });

    test('deve aceitar diferentes formatos de hora válidos', () => {
      mockReq.body.diasAulas = [
        { diaSemana: 'SEGUNDA', horaInicial: '07:30', horaFinal: '09:45' },
        { diaSemana: 'QUARTA', horaInicial: '13:15', horaFinal: '18:30' }
      ];

      validateGenerateAula(mockReq, mockRes, mockNext);

      expect(mockNext.called).toBe(true);
    });
  });

  describe('Validações de múltiplos diasAulas', () => {
    test('deve aceitar múltiplos diasAulas válidos', () => {
      mockReq.body.diasAulas = [
        { diaSemana: 'SEGUNDA', horaInicial: '08:00', horaFinal: '10:00' },
        { diaSemana: 'QUARTA', horaInicial: '14:00', horaFinal: '16:00' },
        { diaSemana: 'SEXTA', horaInicial: '09:00', horaFinal: '11:00' }
      ];

      validateGenerateAula(mockReq, mockRes, mockNext);

      expect(mockNext.called).toBe(true);
    });

    test('deve rejeitar se um dos diasAulas for inválido', () => {
      mockReq.body.diasAulas = [
        { diaSemana: 'SEGUNDA', horaInicial: '08:00', horaFinal: '10:00' },
        { diaSemana: 'INVALIDO', horaInicial: '14:00', horaFinal: '16:00' }
      ];

      validateGenerateAula(mockReq, mockRes, mockNext);

      expect(mockRes.statusCode).toBe(httpStatus.UNPROCESSABLE_ENTITY);
      expect(mockNext.called).toBe(false);
    });

    test('deve rejeitar se um dos diasAulas estiver incompleto', () => {
      mockReq.body.diasAulas = [
        { diaSemana: 'SEGUNDA', horaInicial: '08:00', horaFinal: '10:00' },
        { diaSemana: 'QUARTA', horaInicial: '14:00' }
      ];

      validateGenerateAula(mockReq, mockRes, mockNext);

      expect(mockRes.statusCode).toBe(httpStatus.UNPROCESSABLE_ENTITY);
      expect(mockNext.called).toBe(false);
    });
  });

  describe('Integração completa', () => {
    test('deve processar requisição válida completa', () => {
      mockReq.body = {
        dataInicio: '2025-01-01',
        dataFim: '2025-12-31',
        diasAulas: [
          { diaSemana: 'SEGUNDA', horaInicial: '08:00', horaFinal: '10:00' },
          { diaSemana: 'QUARTA', horaInicial: '10:00', horaFinal: '12:00' },
          { diaSemana: 'SEXTA', horaInicial: '14:00', horaFinal: '16:00' }
        ]
      };

      validateGenerateAula(mockReq, mockRes, mockNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });

    test('deve rejeitar requisição com múltiplos erros', () => {
      mockReq.body = {
        dataInicio: null,
        dataFim: 'data-invalida',
        diasAulas: []
      };

      validateGenerateAula(mockReq, mockRes, mockNext);

      expect(mockRes.statusCode).toBe(httpStatus.UNPROCESSABLE_ENTITY);
      expect(mockNext.called).toBe(false);
    });

    test('deve aceitar diferentes combinações de dias e horários', () => {
      mockReq.body = {
        dataInicio: '2025-01-06',
        dataFim: '2025-02-28',
        diasAulas: [
          { diaSemana: 'TERCA', horaInicial: '07:00', horaFinal: '08:30' },
          { diaSemana: 'QUINTA', horaInicial: '19:00', horaFinal: '21:00' },
          { diaSemana: 'SABADO', horaInicial: '10:00', horaFinal: '12:00' }
        ]
      };

      validateGenerateAula(mockReq, mockRes, mockNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });
  });
});
