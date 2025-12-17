import { validateCreateManyDiaAula } from '../../../../src/middlewares/diaAula/validateCreateManyDiaAula.js';

describe('validateCreateManyDiaAula middleware', () => {
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

  describe('Validações básicas', () => {
    test('deve retornar 400 quando body não é fornecido', () => {
      delete mockReq.body;

      validateCreateManyDiaAula(mockReq, mockRes, () => mockNext.call());

      expect(mockRes.statusCode).toBe(400);
      expect(mockRes.data.message).toBe('Nenhum dado fornecido na requisição');
      expect(mockNext.called).toBe(false);
    });

    test('deve retornar 422 quando body não é um array', () => {
      mockReq.body = { not: 'array' };

      validateCreateManyDiaAula(mockReq, mockRes, () => mockNext.call());

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Erro de validação');
      expect(Array.isArray(mockRes.data.errors)).toBe(true);
      expect(mockNext.called).toBe(false);
    });

    test('deve retornar 422 quando body é um array vazio', () => {
      mockReq.body = [];

      validateCreateManyDiaAula(mockReq, mockRes, () => mockNext.call());

      expect(mockRes.statusCode).toBe(422);
      expect(mockNext.called).toBe(false);
    });
  });

  describe('Validação de idAluno', () => {
    test('deve retornar 422 quando idAluno não é fornecido', () => {
      mockReq.body = [
        {
          SEGUNDA: { quantidadeAulas: 2, horaInicial: '08:00', horaFinal: '10:00' },
          TERCA: { quantidadeAulas: 2, horaInicial: '08:00', horaFinal: '10:00' },
          QUARTA: { quantidadeAulas: 2, horaInicial: '08:00', horaFinal: '10:00' },
          QUINTA: { quantidadeAulas: 2, horaInicial: '08:00', horaFinal: '10:00' },
          SEXTA: { quantidadeAulas: 2, horaInicial: '08:00', horaFinal: '10:00' },
          SABADO: { quantidadeAulas: 0 },
          DOMINGO: { quantidadeAulas: 0 }
        }
      ];

      validateCreateManyDiaAula(mockReq, mockRes, () => mockNext.call());

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Erro de validação');
      expect(mockNext.called).toBe(false);
    });

    test('deve retornar 422 quando idAluno não é string', () => {
      mockReq.body = [
        {
          idAluno: 123456,
          SEGUNDA: { quantidadeAulas: 2, horaInicial: '08:00', horaFinal: '10:00' },
          TERCA: { quantidadeAulas: 2, horaInicial: '08:00', horaFinal: '10:00' },
          QUARTA: { quantidadeAulas: 2, horaInicial: '08:00', horaFinal: '10:00' },
          QUINTA: { quantidadeAulas: 2, horaInicial: '08:00', horaFinal: '10:00' },
          SEXTA: { quantidadeAulas: 2, horaInicial: '08:00', horaFinal: '10:00' },
          SABADO: { quantidadeAulas: 0 },
          DOMINGO: { quantidadeAulas: 0 }
        }
      ];

      validateCreateManyDiaAula(mockReq, mockRes, () => mockNext.call());

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Erro de validação');
      expect(mockNext.called).toBe(false);
    });

    test('deve retornar 422 quando idAluno tem menos de 6 caracteres', () => {
      mockReq.body = [
        {
          idAluno: 'abc12',
          SEGUNDA: { quantidadeAulas: 2, horaInicial: '08:00', horaFinal: '10:00' },
          TERCA: { quantidadeAulas: 2, horaInicial: '08:00', horaFinal: '10:00' },
          QUARTA: { quantidadeAulas: 2, horaInicial: '08:00', horaFinal: '10:00' },
          QUINTA: { quantidadeAulas: 2, horaInicial: '08:00', horaFinal: '10:00' },
          SEXTA: { quantidadeAulas: 2, horaInicial: '08:00', horaFinal: '10:00' },
          SABADO: { quantidadeAulas: 0 },
          DOMINGO: { quantidadeAulas: 0 }
        }
      ];

      validateCreateManyDiaAula(mockReq, mockRes, () => mockNext.call());

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Erro de validação');
      expect(mockNext.called).toBe(false);
    });

    test('deve retornar 422 quando idAluno tem mais de 50 caracteres', () => {
      mockReq.body = [
        {
          idAluno: 'a'.repeat(51),
          SEGUNDA: { quantidadeAulas: 2, horaInicial: '08:00', horaFinal: '10:00' },
          TERCA: { quantidadeAulas: 2, horaInicial: '08:00', horaFinal: '10:00' },
          QUARTA: { quantidadeAulas: 2, horaInicial: '08:00', horaFinal: '10:00' },
          QUINTA: { quantidadeAulas: 2, horaInicial: '08:00', horaFinal: '10:00' },
          SEXTA: { quantidadeAulas: 2, horaInicial: '08:00', horaFinal: '10:00' },
          SABADO: { quantidadeAulas: 0 },
          DOMINGO: { quantidadeAulas: 0 }
        }
      ];

      validateCreateManyDiaAula(mockReq, mockRes, () => mockNext.call());

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Erro de validação');
      expect(mockNext.called).toBe(false);
    });
  });

  describe('Validação de quantidadeAulas', () => {
    test('deve retornar 422 quando quantidadeAulas não é número', () => {
      mockReq.body = [
        {
          idAluno: 'abc123',
          SEGUNDA: { quantidadeAulas: '2', horaInicial: '08:00', horaFinal: '10:00' },
          TERCA: { quantidadeAulas: 2, horaInicial: '08:00', horaFinal: '10:00' },
          QUARTA: { quantidadeAulas: 2, horaInicial: '08:00', horaFinal: '10:00' },
          QUINTA: { quantidadeAulas: 2, horaInicial: '08:00', horaFinal: '10:00' },
          SEXTA: { quantidadeAulas: 2, horaInicial: '08:00', horaFinal: '10:00' },
          SABADO: { quantidadeAulas: 0 },
          DOMINGO: { quantidadeAulas: 0 }
        }
      ];

      validateCreateManyDiaAula(mockReq, mockRes, () => mockNext.call());

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Erro de validação');
      expect(mockNext.called).toBe(false);
    });

    test('deve retornar 422 quando quantidadeAulas é zero ou negativo', () => {
      mockReq.body = [
        {
          idAluno: 'abc123',
          SEGUNDA: { quantidadeAulas: -1, horaInicial: '08:00', horaFinal: '10:00' },
          TERCA: { quantidadeAulas: 2, horaInicial: '08:00', horaFinal: '10:00' },
          QUARTA: { quantidadeAulas: 2, horaInicial: '08:00', horaFinal: '10:00' },
          QUINTA: { quantidadeAulas: 2, horaInicial: '08:00', horaFinal: '10:00' },
          SEXTA: { quantidadeAulas: 2, horaInicial: '08:00', horaFinal: '10:00' },
          SABADO: { quantidadeAulas: 0 },
          DOMINGO: { quantidadeAulas: 0 }
        }
      ];

      validateCreateManyDiaAula(mockReq, mockRes, () => mockNext.call());

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Erro de validação');
      expect(mockNext.called).toBe(false);
    });

    test('deve aceitar quantidadeAulas igual a 0', () => {
      mockReq.body = [
        {
          idAluno: 'abc123',
          SEGUNDA: { quantidadeAulas: 0 },
          TERCA: { quantidadeAulas: 0 },
          QUARTA: { quantidadeAulas: 0 },
          QUINTA: { quantidadeAulas: 0 },
          SEXTA: { quantidadeAulas: 0 },
          SABADO: { quantidadeAulas: 0 },
          DOMINGO: { quantidadeAulas: 0 }
        }
      ];

      validateCreateManyDiaAula(mockReq, mockRes, () => mockNext.call());

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBe(null);
    });
  });

  describe('Validação de horários', () => {
    test('deve retornar 422 quando horaInicial não é string', () => {
      mockReq.body = [
        {
          idAluno: 'abc123',
          SEGUNDA: { quantidadeAulas: 2, horaInicial: 800, horaFinal: '10:00' },
          TERCA: { quantidadeAulas: 2, horaInicial: '08:00', horaFinal: '10:00' },
          QUARTA: { quantidadeAulas: 2, horaInicial: '08:00', horaFinal: '10:00' },
          QUINTA: { quantidadeAulas: 2, horaInicial: '08:00', horaFinal: '10:00' },
          SEXTA: { quantidadeAulas: 2, horaInicial: '08:00', horaFinal: '10:00' },
          SABADO: { quantidadeAulas: 0 },
          DOMINGO: { quantidadeAulas: 0 }
        }
      ];

      validateCreateManyDiaAula(mockReq, mockRes, () => mockNext.call());

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Erro de validação');
      expect(mockNext.called).toBe(false);
    });

    test('deve retornar 422 quando horaFinal não é string', () => {
      mockReq.body = [
        {
          idAluno: 'abc123',
          SEGUNDA: { quantidadeAulas: 2, horaInicial: '08:00', horaFinal: 1000 },
          TERCA: { quantidadeAulas: 2, horaInicial: '08:00', horaFinal: '10:00' },
          QUARTA: { quantidadeAulas: 2, horaInicial: '08:00', horaFinal: '10:00' },
          QUINTA: { quantidadeAulas: 2, horaInicial: '08:00', horaFinal: '10:00' },
          SEXTA: { quantidadeAulas: 2, horaInicial: '08:00', horaFinal: '10:00' },
          SABADO: { quantidadeAulas: 0 },
          DOMINGO: { quantidadeAulas: 0 }
        }
      ];

      validateCreateManyDiaAula(mockReq, mockRes, () => mockNext.call());

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Erro de validação');
      expect(mockNext.called).toBe(false);
    });

    test('deve retornar 422 quando horaFinal é anterior a horaInicial', () => {
      mockReq.body = [
        {
          idAluno: 'abc123',
          SEGUNDA: { quantidadeAulas: 2, horaInicial: '10:00', horaFinal: '08:00' },
          TERCA: { quantidadeAulas: 2, horaInicial: '08:00', horaFinal: '10:00' },
          QUARTA: { quantidadeAulas: 2, horaInicial: '08:00', horaFinal: '10:00' },
          QUINTA: { quantidadeAulas: 2, horaInicial: '08:00', horaFinal: '10:00' },
          SEXTA: { quantidadeAulas: 2, horaInicial: '08:00', horaFinal: '10:00' },
          SABADO: { quantidadeAulas: 0 },
          DOMINGO: { quantidadeAulas: 0 }
        }
      ];

      validateCreateManyDiaAula(mockReq, mockRes, () => mockNext.call());

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Erro de validação');
      expect(mockNext.called).toBe(false);
    });

    test('deve retornar 422 quando horaFinal é igual a horaInicial', () => {
      mockReq.body = [
        {
          idAluno: 'abc123',
          SEGUNDA: { quantidadeAulas: 2, horaInicial: '08:00', horaFinal: '08:00' },
          TERCA: { quantidadeAulas: 2, horaInicial: '08:00', horaFinal: '10:00' },
          QUARTA: { quantidadeAulas: 2, horaInicial: '08:00', horaFinal: '10:00' },
          QUINTA: { quantidadeAulas: 2, horaInicial: '08:00', horaFinal: '10:00' },
          SEXTA: { quantidadeAulas: 2, horaInicial: '08:00', horaFinal: '10:00' },
          SABADO: { quantidadeAulas: 0 },
          DOMINGO: { quantidadeAulas: 0 }
        }
      ];

      validateCreateManyDiaAula(mockReq, mockRes, () => mockNext.call());

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Erro de validação');
      expect(mockNext.called).toBe(false);
    });

    test('deve aceitar horários quando ambos não são fornecidos', () => {
      mockReq.body = [
        {
          idAluno: 'abc123',
          SEGUNDA: { quantidadeAulas: 2 },
          TERCA: { quantidadeAulas: 2 },
          QUARTA: { quantidadeAulas: 2 },
          QUINTA: { quantidadeAulas: 2 },
          SEXTA: { quantidadeAulas: 2 },
          SABADO: { quantidadeAulas: 0 },
          DOMINGO: { quantidadeAulas: 0 }
        }
      ];

      validateCreateManyDiaAula(mockReq, mockRes, () => mockNext.call());

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBe(null);
    });
  });

  describe('Validação completa com todos os dias da semana', () => {
    test('deve chamar next quando payload é válido com todos os campos', () => {
      mockReq.body = [
        {
          idAluno: 'cjld2cjxh0000qzrmn831i7rn',
          SEGUNDA: { quantidadeAulas: 2, horaInicial: '08:00', horaFinal: '10:00' },
          TERCA: { quantidadeAulas: 3, horaInicial: '09:00', horaFinal: '12:00' },
          QUARTA: { quantidadeAulas: 2, horaInicial: '14:00', horaFinal: '16:00' },
          QUINTA: { quantidadeAulas: 1, horaInicial: '08:00', horaFinal: '09:00' },
          SEXTA: { quantidadeAulas: 2, horaInicial: '10:00', horaFinal: '12:00' },
          SABADO: { quantidadeAulas: 1, horaInicial: '08:00', horaFinal: '10:00' },
          DOMINGO: { quantidadeAulas: 0 }
        }
      ];

      validateCreateManyDiaAula(mockReq, mockRes, () => mockNext.call());

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBe(null);
    });

    test('deve chamar next com múltiplos itens no array', () => {
      mockReq.body = [
        {
          idAluno: 'cjld2cjxh0000qzrmn831i7rn',
          SEGUNDA: { quantidadeAulas: 2, horaInicial: '08:00', horaFinal: '10:00' },
          TERCA: { quantidadeAulas: 2, horaInicial: '08:00', horaFinal: '10:00' },
          QUARTA: { quantidadeAulas: 2, horaInicial: '08:00', horaFinal: '10:00' },
          QUINTA: { quantidadeAulas: 2, horaInicial: '08:00', horaFinal: '10:00' },
          SEXTA: { quantidadeAulas: 2, horaInicial: '08:00', horaFinal: '10:00' },
          SABADO: { quantidadeAulas: 0 },
          DOMINGO: { quantidadeAulas: 0 }
        },
        {
          idAluno: 'cjld2cyuq0000t3rmniod1foy',
          SEGUNDA: { quantidadeAulas: 1, horaInicial: '14:00', horaFinal: '15:00' },
          TERCA: { quantidadeAulas: 1, horaInicial: '14:00', horaFinal: '15:00' },
          QUARTA: { quantidadeAulas: 1, horaInicial: '14:00', horaFinal: '15:00' },
          QUINTA: { quantidadeAulas: 1, horaInicial: '14:00', horaFinal: '15:00' },
          SEXTA: { quantidadeAulas: 1, horaInicial: '14:00', horaFinal: '15:00' },
          SABADO: { quantidadeAulas: 0 },
          DOMINGO: { quantidadeAulas: 0 }
        }
      ];

      validateCreateManyDiaAula(mockReq, mockRes, () => mockNext.call());

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBe(null);
    });

    test('deve validar cada dia da semana separadamente - TERCA inválida', () => {
      mockReq.body = [
        {
          idAluno: 'cjld2cjxh0000qzrmn831i7rn',
          SEGUNDA: { quantidadeAulas: 2, horaInicial: '08:00', horaFinal: '10:00' },
          TERCA: { quantidadeAulas: -1, horaInicial: '08:00', horaFinal: '10:00' },
          QUARTA: { quantidadeAulas: 2, horaInicial: '08:00', horaFinal: '10:00' },
          QUINTA: { quantidadeAulas: 2, horaInicial: '08:00', horaFinal: '10:00' },
          SEXTA: { quantidadeAulas: 2, horaInicial: '08:00', horaFinal: '10:00' },
          SABADO: { quantidadeAulas: 0 },
          DOMINGO: { quantidadeAulas: 0 }
        }
      ];

      validateCreateManyDiaAula(mockReq, mockRes, () => mockNext.call());

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Erro de validação');
      expect(mockNext.called).toBe(false);
    });

    test('deve validar cada dia da semana separadamente - DOMINGO inválida', () => {
      mockReq.body = [
        {
          idAluno: 'cjld2cjxh0000qzrmn831i7rn',
          SEGUNDA: { quantidadeAulas: 2, horaInicial: '08:00', horaFinal: '10:00' },
          TERCA: { quantidadeAulas: 2, horaInicial: '08:00', horaFinal: '10:00' },
          QUARTA: { quantidadeAulas: 2, horaInicial: '08:00', horaFinal: '10:00' },
          QUINTA: { quantidadeAulas: 2, horaInicial: '08:00', horaFinal: '10:00' },
          SEXTA: { quantidadeAulas: 2, horaInicial: '08:00', horaFinal: '10:00' },
          SABADO: { quantidadeAulas: 0 },
          DOMINGO: { quantidadeAulas: 2, horaInicial: '12:00', horaFinal: '10:00' }
        }
      ];

      validateCreateManyDiaAula(mockReq, mockRes, () => mockNext.call());

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Erro de validação');
      expect(mockNext.called).toBe(false);
    });
  });

  describe('Validação de erro em múltiplos itens', () => {
    test('deve retornar 422 quando o segundo item tem erro', () => {
      mockReq.body = [
        {
          idAluno: 'cjld2cjxh0000qzrmn831i7rn',
          SEGUNDA: { quantidadeAulas: 2, horaInicial: '08:00', horaFinal: '10:00' },
          TERCA: { quantidadeAulas: 2, horaInicial: '08:00', horaFinal: '10:00' },
          QUARTA: { quantidadeAulas: 2, horaInicial: '08:00', horaFinal: '10:00' },
          QUINTA: { quantidadeAulas: 2, horaInicial: '08:00', horaFinal: '10:00' },
          SEXTA: { quantidadeAulas: 2, horaInicial: '08:00', horaFinal: '10:00' },
          SABADO: { quantidadeAulas: 0 },
          DOMINGO: { quantidadeAulas: 0 }
        },
        {
          idAluno: 'abc',
          SEGUNDA: { quantidadeAulas: 1, horaInicial: '14:00', horaFinal: '15:00' },
          TERCA: { quantidadeAulas: 1, horaInicial: '14:00', horaFinal: '15:00' },
          QUARTA: { quantidadeAulas: 1, horaInicial: '14:00', horaFinal: '15:00' },
          QUINTA: { quantidadeAulas: 1, horaInicial: '14:00', horaFinal: '15:00' },
          SEXTA: { quantidadeAulas: 1, horaInicial: '14:00', horaFinal: '15:00' },
          SABADO: { quantidadeAulas: 0 },
          DOMINGO: { quantidadeAulas: 0 }
        }
      ];

      validateCreateManyDiaAula(mockReq, mockRes, () => mockNext.call());

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Erro de validação');
      expect(mockNext.called).toBe(false);
    });
  });
});
