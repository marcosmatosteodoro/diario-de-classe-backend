import { validateId } from '../../../src/middlewares/validateId.js';

describe('validateId middleware', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      params: {},
      t: key => {
        const translations = {
          'validation.id.required': 'ID é obrigatório',
          'validation.id.invalid': 'ID deve ser um identificador válido'
        };
        return translations[key] || key;
      }
    };

    mockRes = {
      statusCode: null,
      responseData: null,
      status: function (code) {
        this.statusCode = code;
        return this;
      },
      json: function (data) {
        this.responseData = data;
        return this;
      }
    };

    mockNext = {
      called: false,
      callNext: function () {
        this.called = true;
      }
    };
  });

  describe('Validação de CUID válido', () => {
    test('deve chamar next() para CUID válido', () => {
      mockReq.params.id = 'cjld2cjxh0000qzrmn831i7rn';

      validateId(mockReq, mockRes, () => mockNext.callNext());

      expect(mockNext.called).toBe(true);
      expect(mockReq.validatedId).toBe('cjld2cjxh0000qzrmn831i7rn');
      expect(mockRes.statusCode).toBe(null);
    });

    test('deve aceitar outro CUID válido', () => {
      mockReq.params.id = 'cjld2cyuq0000t3rmniod1foy';

      validateId(mockReq, mockRes, () => mockNext.callNext());

      expect(mockNext.called).toBe(true);
      expect(mockReq.validatedId).toBe('cjld2cyuq0000t3rmniod1foy');
    });

    test('deve aceitar CUID com diferentes caracteres válidos', () => {
      mockReq.params.id = 'c123456789012345678901234';

      validateId(mockReq, mockRes, () => mockNext.callNext());

      expect(mockNext.called).toBe(true);
      expect(mockReq.validatedId).toBe('c123456789012345678901234');
    });
  });

  describe('Validação de ID inválido', () => {
    test('deve retornar 400 quando ID não é fornecido', () => {
      mockReq.params.id = undefined;

      validateId(mockReq, mockRes, () => mockNext.callNext());

      expect(mockRes.statusCode).toBe(400);
      expect(mockRes.responseData).toEqual({
        message: 'ID é obrigatório'
      });
      expect(mockNext.called).toBe(false);
    });

    test('deve retornar 400 quando ID é string vazia', () => {
      mockReq.params.id = '';

      validateId(mockReq, mockRes, () => mockNext.callNext());

      expect(mockRes.statusCode).toBe(400);
      expect(mockRes.responseData).toEqual({
        message: 'ID é obrigatório'
      });
      expect(mockNext.called).toBe(false);
    });

    test('deve retornar 400 quando ID é null', () => {
      mockReq.params.id = null;

      validateId(mockReq, mockRes, () => mockNext.callNext());

      expect(mockRes.statusCode).toBe(400);
      expect(mockRes.responseData).toEqual({
        message: 'ID é obrigatório'
      });
      expect(mockNext.called).toBe(false);
    });

    test('deve retornar 400 quando ID não começa com "c"', () => {
      mockReq.params.id = 'bjld2cjxh0000qzrmn831i7rn';

      validateId(mockReq, mockRes, () => mockNext.callNext());

      expect(mockRes.statusCode).toBe(400);
      expect(mockRes.responseData).toEqual({
        message: 'ID deve ser um identificador válido'
      });
      expect(mockNext.called).toBe(false);
    });

    test('deve retornar 400 quando ID é muito curto', () => {
      mockReq.params.id = 'c123';

      validateId(mockReq, mockRes, () => mockNext.callNext());

      expect(mockRes.statusCode).toBe(400);
      expect(mockRes.responseData).toEqual({
        message: 'ID deve ser um identificador válido'
      });
      expect(mockNext.called).toBe(false);
    });

    test('deve retornar 400 quando ID é muito longo', () => {
      mockReq.params.id = 'c123456789012345678901234567890';

      validateId(mockReq, mockRes, () => mockNext.callNext());

      expect(mockRes.statusCode).toBe(400);
      expect(mockRes.responseData).toEqual({
        message: 'ID deve ser um identificador válido'
      });
      expect(mockNext.called).toBe(false);
    });

    test('deve retornar 400 quando ID contém caracteres maiúsculos', () => {
      mockReq.params.id = 'cJLD2CJXH0000QZRMN831I7RN';

      validateId(mockReq, mockRes, () => mockNext.callNext());

      expect(mockRes.statusCode).toBe(400);
      expect(mockRes.responseData).toEqual({
        message: 'ID deve ser um identificador válido'
      });
      expect(mockNext.called).toBe(false);
    });

    test('deve retornar 400 quando ID contém caracteres especiais', () => {
      mockReq.params.id = 'cjld2cjxh0000qzrmn@31i7rn';

      validateId(mockReq, mockRes, () => mockNext.callNext());

      expect(mockRes.statusCode).toBe(400);
      expect(mockRes.responseData).toEqual({
        message: 'ID deve ser um identificador válido'
      });
      expect(mockNext.called).toBe(false);
    });

    test('deve retornar 400 para números simples', () => {
      mockReq.params.id = '123';

      validateId(mockReq, mockRes, () => mockNext.callNext());

      expect(mockRes.statusCode).toBe(400);
      expect(mockRes.responseData).toEqual({
        message: 'ID deve ser um identificador válido'
      });
      expect(mockNext.called).toBe(false);
    });
  });

  describe('Funcionalidade sem tradução', () => {
    test('deve usar mensagem padrão quando req.t não existe', () => {
      mockReq.t = undefined;
      mockReq.params.id = undefined;

      validateId(mockReq, mockRes, () => mockNext.callNext());

      expect(mockRes.statusCode).toBe(400);
      expect(mockRes.responseData).toEqual({
        message: 'ID é obrigatório'
      });
    });

    test('deve usar mensagem padrão para ID inválido quando req.t não existe', () => {
      mockReq.t = undefined;
      mockReq.params.id = 'invalid-id';

      validateId(mockReq, mockRes, () => mockNext.callNext());

      expect(mockRes.statusCode).toBe(400);
      expect(mockRes.responseData).toEqual({
        message: 'ID deve ser um identificador válido'
      });
    });
  });

  describe('Propriedade validatedId', () => {
    test('deve adicionar validatedId ao req', () => {
      const validCuid = 'cjld2cjxh0000qzrmn831i7rn';
      mockReq.params.id = validCuid;

      validateId(mockReq, mockRes, () => mockNext.callNext());

      expect(mockReq.validatedId).toBe(validCuid);
      expect(typeof mockReq.validatedId).toBe('string');
      expect(mockNext.called).toBe(true);
    });

    test('deve manter CUID como string', () => {
      const validCuid = 'cjld2cyuq0000t3rmniod1foy';
      mockReq.params.id = validCuid;

      validateId(mockReq, mockRes, () => mockNext.callNext());

      expect(mockReq.validatedId).toBe(validCuid);
      expect(typeof mockReq.validatedId).toBe('string');
      expect(mockNext.called).toBe(true);
    });
  });
});
