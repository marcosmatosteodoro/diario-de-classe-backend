import { validateCreateLivro } from '../../../../src/middlewares/livro/validateCreateLivro.js';

describe('validateCreateLivro middleware', () => {
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

  test('deve retornar 400 quando o corpo não é enviado', () => {
    delete mockReq.body;

    validateCreateLivro(mockReq, mockRes, () => mockNext.call());

    expect(mockRes.statusCode).toBe(400);
    expect(mockNext.called).toBe(false);
  });

  test('deve retornar 422 quando o nome não é enviado', () => {
    mockReq.body = { idioma: 'INGLES' };

    validateCreateLivro(mockReq, mockRes, () => mockNext.call());

    expect(mockRes.statusCode).toBe(422);
    expect(mockNext.called).toBe(false);
  });

  test('deve retornar 422 quando o idioma não é um valor do enum', () => {
    mockReq.body = { nome: 'New Interchange 1', idioma: 'ALEMAO' };

    validateCreateLivro(mockReq, mockRes, () => mockNext.call());

    expect(mockRes.statusCode).toBe(422);
    expect(mockRes.data.errors.join(' ')).toContain('idioma');
    expect(mockNext.called).toBe(false);
  });

  test('deve retornar 422 quando o nível não é positivo', () => {
    mockReq.body = { nome: 'New Interchange 1', idioma: 'INGLES', nivel: 0 };

    validateCreateLivro(mockReq, mockRes, () => mockNext.call());

    expect(mockRes.statusCode).toBe(422);
    expect(mockNext.called).toBe(false);
  });

  test('deve seguir com dados válidos e expor apenas os campos permitidos', () => {
    mockReq.body = {
      nome: 'New Interchange 1',
      idioma: 'INGLES',
      nivel: 1,
      ativo: true,
      // Campo não permitido: não deve chegar em validatedData.
      id: 'tentativa-de-forcar-id'
    };

    validateCreateLivro(mockReq, mockRes, () => mockNext.call());

    expect(mockNext.called).toBe(true);
    expect(mockReq.validatedData).toEqual({
      nome: 'New Interchange 1',
      idioma: 'INGLES',
      nivel: 1,
      ativo: true
    });
    expect(mockReq.validatedData.id).toBeUndefined();
  });

  test('deve aceitar livro sem nível informado', () => {
    mockReq.body = { nome: 'Espanhol Básico', idioma: 'ESPANHOL' };

    validateCreateLivro(mockReq, mockRes, () => mockNext.call());

    expect(mockNext.called).toBe(true);
    expect(mockReq.validatedData).toEqual({ nome: 'Espanhol Básico', idioma: 'ESPANHOL' });
  });
});
