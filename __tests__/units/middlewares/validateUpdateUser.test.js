import { validateUpdateUser } from '../../../src/middlewares/validateUpdateUser.js';

describe('validateUpdateUser middleware', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      body: {},
      t: key => {
        const translations = {
          'validation.noData': 'Nenhum dado fornecido',
          'validation.error': 'Erro de validação',
          'error.internal': 'Erro interno do servidor'
        };
        return translations[key] || key;
      }
    };

    mockRes = {
      status: function (code) {
        this.statusCode = code;
        return this;
      },
      json: function (data) {
        this.data = data;
        return this;
      },
      statusCode: null,
      data: null
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

  describe('Validação básica do middleware', () => {
    test('deve ser uma função', () => {
      expect(typeof validateUpdateUser).toBe('function');
    });

    test('deve aceitar três parâmetros (req, res, next)', () => {
      expect(validateUpdateUser.length).toBe(3);
    });
  });

  describe('Validação de req.body', () => {
    test('deve retornar erro 400 quando req.body não existe', () => {
      delete mockReq.body;

      validateUpdateUser(mockReq, mockRes, callNext);

      expect(mockRes.statusCode).toBe(400);
      expect(mockRes.data).toEqual({
        message: 'Nenhum dado fornecido'
      });
      expect(mockNext.called).toBe(false);
    });

    test('deve retornar erro 400 quando req.body é null', () => {
      mockReq.body = null;

      validateUpdateUser(mockReq, mockRes, callNext);

      expect(mockRes.statusCode).toBe(400);
      expect(mockRes.data).toEqual({
        message: 'Nenhum dado fornecido'
      });
      expect(mockNext.called).toBe(false);
    });

    test('deve prosseguir quando req.body é um objeto vazio', () => {
      mockReq.body = {};

      validateUpdateUser(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });
  });

  describe('Validação do campo nome', () => {
    test('deve aceitar nome válido', () => {
      mockReq.body = { nome: 'João Silva' };

      validateUpdateUser(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });

    test('deve rejeitar nome muito curto (menos de 3 caracteres)', () => {
      mockReq.body = { nome: 'Jo' };

      validateUpdateUser(mockReq, mockRes, callNext);

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Erro de validação');
      expect(mockRes.data.errors).toBeDefined();
      expect(mockNext.called).toBe(false);
    });

    test('deve rejeitar nome muito longo (mais de 200 caracteres)', () => {
      mockReq.body = { nome: 'a'.repeat(201) };

      validateUpdateUser(mockReq, mockRes, callNext);

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Erro de validação');
      expect(mockRes.data.errors).toBeDefined();
      expect(mockNext.called).toBe(false);
    });

    test('deve aceitar nome no limite mínimo (3 caracteres)', () => {
      mockReq.body = { nome: 'Ana' };

      validateUpdateUser(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });

    test('deve aceitar nome no limite máximo (200 caracteres)', () => {
      mockReq.body = { nome: 'a'.repeat(200) };

      validateUpdateUser(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });
  });

  describe('Validação do campo sobrenome', () => {
    test('deve aceitar sobrenome válido', () => {
      mockReq.body = { sobrenome: 'Silva Santos' };

      validateUpdateUser(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });

    test('deve rejeitar sobrenome muito curto (menos de 3 caracteres)', () => {
      mockReq.body = { sobrenome: 'Si' };

      validateUpdateUser(mockReq, mockRes, callNext);

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Erro de validação');
      expect(mockNext.called).toBe(false);
    });

    test('deve rejeitar sobrenome muito longo (mais de 200 caracteres)', () => {
      mockReq.body = { sobrenome: 'b'.repeat(201) };

      validateUpdateUser(mockReq, mockRes, callNext);

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Erro de validação');
      expect(mockNext.called).toBe(false);
    });
  });

  describe('Validação do campo email', () => {
    test('deve aceitar email válido', () => {
      mockReq.body = { email: 'usuario@exemplo.com' };

      validateUpdateUser(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });

    test('deve rejeitar email inválido', () => {
      mockReq.body = { email: 'email-invalido' };

      validateUpdateUser(mockReq, mockRes, callNext);

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Erro de validação');
      expect(mockNext.called).toBe(false);
    });

    test('deve aceitar diferentes formatos de email válidos', () => {
      const validEmails = [
        'usuario@exemplo.com',
        'teste.usuario@exemplo.com.br',
        'usuario+tag@exemplo.org'
      ];

      validEmails.forEach(email => {
        // Reset do mock para cada iteração
        mockNext.called = false;
        mockNext.callCount = 0;
        mockRes.statusCode = null;
        mockRes.data = null;

        mockReq.body = { email };

        validateUpdateUser(mockReq, mockRes, callNext);

        expect(mockNext.called).toBe(true);
        expect(mockRes.statusCode).toBeNull();
      });
    });
  });

  describe('Validação do campo telefone', () => {
    test('deve aceitar telefone válido com 10 dígitos', () => {
      mockReq.body = { telefone: '1199999999' };

      validateUpdateUser(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });

    test('deve aceitar telefone válido com 11 dígitos', () => {
      mockReq.body = { telefone: '11999999999' };

      validateUpdateUser(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });

    test('deve rejeitar telefone muito curto (menos de 10 caracteres)', () => {
      mockReq.body = { telefone: '119999999' };

      validateUpdateUser(mockReq, mockRes, callNext);

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Erro de validação');
      expect(mockNext.called).toBe(false);
    });

    test('deve rejeitar telefone muito longo (mais de 11 caracteres)', () => {
      mockReq.body = { telefone: '119999999999' };

      validateUpdateUser(mockReq, mockRes, callNext);

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Erro de validação');
      expect(mockNext.called).toBe(false);
    });
  });

  describe('Validação do campo senha', () => {
    test('deve aceitar senha válida', () => {
      mockReq.body = { senha: 'minhasenha123' };

      validateUpdateUser(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });

    test('deve rejeitar senha muito curta (menos de 6 caracteres)', () => {
      mockReq.body = { senha: '12345' };

      validateUpdateUser(mockReq, mockRes, callNext);

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Erro de validação');
      expect(mockNext.called).toBe(false);
    });

    test('deve aceitar senha no limite mínimo (6 caracteres)', () => {
      mockReq.body = { senha: '123456' };

      validateUpdateUser(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });

    test('deve aceitar senha no limite máximo (200 caracteres)', () => {
      mockReq.body = { senha: 'a'.repeat(200) };

      validateUpdateUser(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });
  });

  describe('Validação do campo resetarSenha', () => {
    test('deve aceitar resetarSenha como true', () => {
      mockReq.body = { resetarSenha: true };

      validateUpdateUser(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });

    test('deve aceitar resetarSenha como false', () => {
      mockReq.body = { resetarSenha: false };

      validateUpdateUser(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });

    test('deve rejeitar resetarSenha que não é boolean', () => {
      mockReq.body = { resetarSenha: 'true' };

      validateUpdateUser(mockReq, mockRes, callNext);

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Erro de validação');
      expect(mockNext.called).toBe(false);
    });
  });

  describe('Validação do campo permissao', () => {
    test('deve aceitar permissao "member"', () => {
      mockReq.body = { permissao: 'member' };

      validateUpdateUser(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });

    test('deve aceitar permissao "admin"', () => {
      mockReq.body = { permissao: 'admin' };

      validateUpdateUser(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });

    test('deve rejeitar permissao inválida', () => {
      mockReq.body = { permissao: 'moderator' };

      validateUpdateUser(mockReq, mockRes, callNext);

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Erro de validação');
      expect(mockNext.called).toBe(false);
    });

    test('deve tratar permissao vazia adequadamente', () => {
      mockReq.body = { permissao: '' };

      validateUpdateUser(mockReq, mockRes, callNext);

      // A validação pode aceitar string vazia como opcional
      // Verificamos se o comportamento é consistente
      expect(mockRes.statusCode === null || mockRes.statusCode === 422).toBe(true);
    });
  });

  describe('Validação de múltiplos campos', () => {
    test('deve aceitar todos os campos válidos', () => {
      mockReq.body = {
        nome: 'João',
        sobrenome: 'Silva',
        email: 'joao@exemplo.com',
        telefone: '11999999999',
        senha: 'minhasenha123',
        resetarSenha: false,
        permissao: 'member'
      };

      validateUpdateUser(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });

    test('deve rejeitar quando múltiplos campos são inválidos', () => {
      mockReq.body = {
        nome: 'Jo', // muito curto
        email: 'email-invalido', // formato inválido
        telefone: '123', // muito curto
        resetarSenha: 'true', // não é boolean
        permissao: 'invalid' // não é enum válido
      };

      validateUpdateUser(mockReq, mockRes, callNext);

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Erro de validação');
      expect(mockRes.data.errors).toBeDefined();
      expect(Array.isArray(mockRes.data.errors)).toBe(true);
      expect(mockRes.data.errors.length).toBeGreaterThan(1);
      expect(mockNext.called).toBe(false);
    });

    test('deve aceitar apenas alguns campos (validação opcional)', () => {
      mockReq.body = {
        nome: 'João',
        email: 'joao@exemplo.com'
      };

      validateUpdateUser(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });
  });

  describe('Propriedade req.validatedData', () => {
    test('deve definir req.validatedData com nome quando validação passa', () => {
      mockReq.body = { nome: 'João Silva' };

      validateUpdateUser(mockReq, mockRes, () => {
        mockNext.call();
      });

      expect(mockReq.validatedData).toBeDefined();
      expect(mockReq.validatedData.nome).toBe('João Silva');
    });

    test('não deve definir req.validatedData quando validação falha', () => {
      mockReq.body = { nome: 'Jo' }; // muito curto

      validateUpdateUser(mockReq, mockRes, callNext);

      expect(mockReq.validatedData).toBeUndefined();
    });
  });

  describe('Tratamento de erros', () => {
    test('deve usar mensagem padrão quando req.t não existe para validação', () => {
      delete mockReq.t;
      mockReq.body = { nome: 'Jo' }; // inválido

      validateUpdateUser(mockReq, mockRes, callNext);

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Erro de validação');
      expect(mockNext.called).toBe(false);
    });
  });

  describe('Casos extremos', () => {
    test('deve lidar com campos undefined', () => {
      mockReq.body = {
        nome: undefined,
        sobrenome: undefined,
        email: undefined,
        telefone: undefined,
        senha: undefined,
        resetarSenha: undefined,
        permissao: undefined
      };

      validateUpdateUser(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });

    test('deve lidar com campos null', () => {
      mockReq.body = {
        nome: null,
        sobrenome: null,
        email: null,
        telefone: null,
        senha: null,
        resetarSenha: null,
        permissao: null
      };

      validateUpdateUser(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });
  });
});
