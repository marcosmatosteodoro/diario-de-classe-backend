import { validateSearchQuery } from '../../../src/middlewares/validateSearchQuery.js';

describe('validateSearchQuery middleware', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      query: {},
      t: key => {
        const translations = {
          'validation.search.invalidType': 'Parâmetro de busca deve ser uma string',
          'validation.search.tooLong': 'Parâmetro de busca muito longo',
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
      callCount: 0,
      call: function () {
        this.called = true;
        this.callCount += 1;
      }
    };
  });

  // Função helper para simular chamada do next
  const callNext = () => mockNext.call();

  describe('Parâmetro q ausente', () => {
    test('deve chamar next() quando não há parâmetro q', () => {
      validateSearchQuery(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBe(null);
    });

    test('deve chamar next() quando query está vazio', () => {
      mockReq.query = {};

      validateSearchQuery(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBe(null);
    });
  });

  describe('Parâmetro q vazio ou inválido', () => {
    test('deve remover parâmetro q quando é string vazia', () => {
      mockReq.query = { q: '' };

      validateSearchQuery(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockReq.query.q).toBeUndefined();
    });

    test('deve remover parâmetro q quando é null', () => {
      mockReq.query = { q: null };

      validateSearchQuery(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockReq.query.q).toBeUndefined();
    });

    test('deve remover parâmetro q quando é undefined', () => {
      mockReq.query = { q: undefined };

      validateSearchQuery(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockReq.query.q).toBeUndefined();
    });

    test('deve remover parâmetro q quando contém apenas espaços', () => {
      mockReq.query = { q: '   ' };

      validateSearchQuery(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockReq.query.q).toBeUndefined();
    });

    test('deve remover parâmetro q quando contém apenas tabs e quebras de linha', () => {
      mockReq.query = { q: '\t\n  \r  ' };

      validateSearchQuery(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockReq.query.q).toBeUndefined();
    });
  });

  describe('Validação de tipo', () => {
    test('deve retornar erro 400 quando q não é string (número)', () => {
      mockReq.query = { q: 123 };

      validateSearchQuery(mockReq, mockRes, callNext);

      expect(mockRes.statusCode).toBe(400);
      expect(mockRes.data.message).toBe('Parâmetro de busca deve ser uma string');
      expect(mockRes.data.field).toBe('q');
      expect(mockNext.called).toBe(false);
    });

    test('deve retornar erro 400 quando q não é string (boolean)', () => {
      mockReq.query = { q: true };

      validateSearchQuery(mockReq, mockRes, callNext);

      expect(mockRes.statusCode).toBe(400);
      expect(mockRes.data.message).toBe('Parâmetro de busca deve ser uma string');
      expect(mockRes.data.field).toBe('q');
      expect(mockNext.called).toBe(false);
    });

    test('deve retornar erro 400 quando q não é string (array)', () => {
      mockReq.query = { q: ['busca'] };

      validateSearchQuery(mockReq, mockRes, callNext);

      expect(mockRes.statusCode).toBe(400);
      expect(mockRes.data.message).toBe('Parâmetro de busca deve ser uma string');
      expect(mockNext.called).toBe(false);
    });

    test('deve retornar erro 400 quando q não é string (objeto)', () => {
      mockReq.query = { q: { busca: 'teste' } };

      validateSearchQuery(mockReq, mockRes, callNext);

      expect(mockRes.statusCode).toBe(400);
      expect(mockRes.data.message).toBe('Parâmetro de busca deve ser uma string');
      expect(mockNext.called).toBe(false);
    });
  });

  describe('Validação de tamanho', () => {
    test('deve retornar erro 400 quando q é muito longo (mais de 200 caracteres)', () => {
      mockReq.query = { q: 'a'.repeat(201) };

      validateSearchQuery(mockReq, mockRes, callNext);

      expect(mockRes.statusCode).toBe(400);
      expect(mockRes.data.message).toBe('Parâmetro de busca muito longo');
      expect(mockRes.data.field).toBe('q');
      expect(mockNext.called).toBe(false);
    });

    test('deve aceitar q com exatamente 200 caracteres', () => {
      const longQuery = 'a'.repeat(200);
      mockReq.query = { q: longQuery };

      validateSearchQuery(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockReq.query.q).toBe(longQuery);
      expect(mockRes.statusCode).toBe(null);
    });

    test('deve aceitar q com 199 caracteres', () => {
      const longQuery = 'a'.repeat(199);
      mockReq.query = { q: longQuery };

      validateSearchQuery(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockReq.query.q).toBe(longQuery);
    });
  });

  describe('Parâmetros válidos', () => {
    test('deve aceitar string válida simples', () => {
      mockReq.query = { q: 'João' };

      validateSearchQuery(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockReq.query.q).toBe('João');
      expect(mockRes.statusCode).toBe(null);
    });

    test('deve aceitar string com espaços no meio', () => {
      mockReq.query = { q: 'João Silva' };

      validateSearchQuery(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockReq.query.q).toBe('João Silva');
    });

    test('deve fazer trim da string (espaços no início e fim)', () => {
      mockReq.query = { q: '  João Silva  ' };

      validateSearchQuery(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockReq.query.q).toBe('João Silva');
    });

    test('deve aceitar string com caracteres especiais', () => {
      mockReq.query = { q: 'João & Maria' };

      validateSearchQuery(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockReq.query.q).toBe('João & Maria');
    });

    test('deve aceitar string com números', () => {
      mockReq.query = { q: 'João123' };

      validateSearchQuery(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockReq.query.q).toBe('João123');
    });

    test('deve aceitar string com acentos e caracteres especiais', () => {
      mockReq.query = { q: 'João Ação Coração' };

      validateSearchQuery(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockReq.query.q).toBe('João Ação Coração');
    });

    test('deve aceitar um único caractere', () => {
      mockReq.query = { q: 'a' };

      validateSearchQuery(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockReq.query.q).toBe('a');
    });
  });

  describe('Tradução e internacionalização', () => {
    test('deve usar tradução quando req.t existe para tipo inválido', () => {
      mockReq.query = { q: 123 };

      validateSearchQuery(mockReq, mockRes, callNext);

      expect(mockRes.data.message).toBe('Parâmetro de busca deve ser uma string');
    });

    test('deve usar tradução quando req.t existe para string muito longa', () => {
      mockReq.query = { q: 'a'.repeat(201) };

      validateSearchQuery(mockReq, mockRes, callNext);

      expect(mockRes.data.message).toBe('Parâmetro de busca muito longo');
    });

    test('deve usar mensagem padrão quando req.t não existe para tipo inválido', () => {
      delete mockReq.t;
      mockReq.query = { q: 123 };

      validateSearchQuery(mockReq, mockRes, callNext);

      expect(mockRes.data.message).toBe('Parâmetro de busca deve ser uma string');
    });

    test('deve usar mensagem padrão quando req.t não existe para string muito longa', () => {
      delete mockReq.t;
      mockReq.query = { q: 'a'.repeat(201) };

      validateSearchQuery(mockReq, mockRes, callNext);

      expect(mockRes.data.message).toBe('Parâmetro de busca muito longo');
    });
  });

  describe('Tratamento de erros', () => {
    test('deve tratar erro interno e retornar 500', () => {
      // Simula erro interno alterando o objeto req
      Object.defineProperty(mockReq, 'query', {
        get() {
          throw new Error('Erro interno na query');
        }
      });

      validateSearchQuery(mockReq, mockRes, callNext);

      expect(mockRes.statusCode).toBe(500);
      expect(mockRes.data.message).toBe('Erro interno do servidor');
      expect(mockRes.data.error).toBe('Erro interno na query');
      expect(mockNext.called).toBe(false);
    });

    test('deve usar tradução quando req.t existe para erro interno', () => {
      Object.defineProperty(mockReq, 'query', {
        get() {
          throw new Error('Erro interno na query');
        }
      });

      validateSearchQuery(mockReq, mockRes, callNext);

      expect(mockRes.data.message).toBe('Erro interno do servidor');
    });

    test('deve usar mensagem padrão quando req.t não existe para erro interno', () => {
      delete mockReq.t;
      Object.defineProperty(mockReq, 'query', {
        get() {
          throw new Error('Erro interno na query');
        }
      });

      validateSearchQuery(mockReq, mockRes, callNext);

      expect(mockRes.data.message).toBe('Erro interno do servidor');
    });
  });

  describe('Preservação de outros parâmetros', () => {
    test('deve preservar outros parâmetros quando q é válido', () => {
      mockReq.query = { q: 'João', page: '1', limit: '10' };

      validateSearchQuery(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockReq.query.q).toBe('João');
      expect(mockReq.query.page).toBe('1');
      expect(mockReq.query.limit).toBe('10');
    });

    test('deve preservar outros parâmetros quando q é removido', () => {
      mockReq.query = { q: '', page: '1', limit: '10' };

      validateSearchQuery(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockReq.query.q).toBeUndefined();
      expect(mockReq.query.page).toBe('1');
      expect(mockReq.query.limit).toBe('10');
    });
  });

  describe('Casos extremos', () => {
    test('deve lidar com string contendo apenas números', () => {
      mockReq.query = { q: '123456' };

      validateSearchQuery(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockReq.query.q).toBe('123456');
    });

    test('deve lidar com string contendo emojis', () => {
      mockReq.query = { q: 'João 😊' };

      validateSearchQuery(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockReq.query.q).toBe('João 😊');
    });

    test('deve lidar com string vazia após trim', () => {
      mockReq.query = { q: '\t  \n  \r  ' };

      validateSearchQuery(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockReq.query.q).toBeUndefined();
    });
  });
});
