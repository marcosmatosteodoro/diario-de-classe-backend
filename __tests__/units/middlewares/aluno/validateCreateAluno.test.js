import { validateCreateAluno } from '../../../../src/middlewares/aluno/validateCreateAluno.js';

describe('validateCreateAluno middleware', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      body: {},
      t: key => {
        const translations = {
          'validation.noData': 'Dados não fornecidos',
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
      expect(typeof validateCreateAluno).toBe('function');
    });

    test('deve aceitar três parâmetros (req, res, next)', () => {
      expect(validateCreateAluno.length).toBe(3);
    });
  });

  describe('Validação de req.body', () => {
    test('deve retornar erro 400 quando req.body não existe', () => {
      delete mockReq.body;

      validateCreateAluno(mockReq, mockRes, callNext);

      expect(mockRes.statusCode).toBe(400);
      expect(mockRes.data).toEqual({
        message: 'Dados não fornecidos'
      });
      expect(mockNext.called).toBe(false);
    });

    test('deve retornar erro 400 quando req.body é null', () => {
      mockReq.body = null;

      validateCreateAluno(mockReq, mockRes, callNext);

      expect(mockRes.statusCode).toBe(400);
      expect(mockRes.data).toEqual({
        message: 'Dados não fornecidos'
      });
      expect(mockNext.called).toBe(false);
    });

    test('deve rejeitar quando req.body é um objeto vazio (campos obrigatórios)', () => {
      mockReq.body = {};

      validateCreateAluno(mockReq, mockRes, callNext);

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Erro de validação');
      expect(mockRes.data.errors).toBeDefined();
      expect(mockNext.called).toBe(false);
    });
  });

  describe('Validação do campo nome (obrigatório)', () => {
    test('deve aceitar nome válido', () => {
      mockReq.body = {
        nome: 'João Silva',
        sobrenome: 'Santos',
        email: 'joao@exemplo.com'
      };

      validateCreateAluno(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });

    test('deve rejeitar quando nome não é fornecido', () => {
      mockReq.body = {
        sobrenome: 'Silva',
        email: 'test@exemplo.com'
      };

      validateCreateAluno(mockReq, mockRes, callNext);

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Erro de validação');
      expect(mockRes.data.errors).toBeDefined();
      expect(mockNext.called).toBe(false);
    });

    test('deve rejeitar nome muito curto (menos de 3 caracteres)', () => {
      mockReq.body = {
        nome: 'Jo',
        sobrenome: 'Silva',
        email: 'jo@exemplo.com'
      };

      validateCreateAluno(mockReq, mockRes, callNext);

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Erro de validação');
      expect(mockRes.data.errors).toBeDefined();
      expect(mockNext.called).toBe(false);
    });

    test('deve rejeitar nome muito longo (mais de 200 caracteres)', () => {
      mockReq.body = {
        nome: 'a'.repeat(201),
        sobrenome: 'Silva',
        email: 'test@exemplo.com'
      };

      validateCreateAluno(mockReq, mockRes, callNext);

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Erro de validação');
      expect(mockRes.data.errors).toBeDefined();
      expect(mockNext.called).toBe(false);
    });

    test('deve aceitar nome no limite mínimo (3 caracteres)', () => {
      mockReq.body = {
        nome: 'Ana',
        sobrenome: 'Silva',
        email: 'ana@exemplo.com'
      };

      validateCreateAluno(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });

    test('deve aceitar nome no limite máximo (200 caracteres)', () => {
      mockReq.body = {
        nome: 'a'.repeat(200),
        sobrenome: 'Silva',
        email: 'test@exemplo.com'
      };

      validateCreateAluno(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });

    test('deve rejeitar nome que não é string', () => {
      mockReq.body = {
        nome: 123,
        sobrenome: 'Silva',
        email: 'test@exemplo.com'
      };

      validateCreateAluno(mockReq, mockRes, callNext);

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Erro de validação');
      expect(mockNext.called).toBe(false);
    });
  });

  describe('Validação do campo sobrenome (obrigatório)', () => {
    test('deve aceitar sobrenome válido', () => {
      mockReq.body = {
        nome: 'João',
        sobrenome: 'Silva Santos',
        email: 'joao@exemplo.com'
      };

      validateCreateAluno(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });

    test('deve rejeitar quando sobrenome não é fornecido', () => {
      mockReq.body = {
        nome: 'João',
        email: 'joao@exemplo.com'
      };

      validateCreateAluno(mockReq, mockRes, callNext);

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Erro de validação');
      expect(mockRes.data.errors).toBeDefined();
      expect(mockNext.called).toBe(false);
    });

    test('deve rejeitar sobrenome muito curto (menos de 3 caracteres)', () => {
      mockReq.body = {
        nome: 'João',
        sobrenome: 'Si',
        email: 'joao@exemplo.com'
      };

      validateCreateAluno(mockReq, mockRes, callNext);

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Erro de validação');
      expect(mockNext.called).toBe(false);
    });

    test('deve rejeitar sobrenome muito longo (mais de 200 caracteres)', () => {
      mockReq.body = {
        nome: 'João',
        sobrenome: 'b'.repeat(201),
        email: 'joao@exemplo.com'
      };

      validateCreateAluno(mockReq, mockRes, callNext);

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Erro de validação');
      expect(mockNext.called).toBe(false);
    });

    test('deve rejeitar sobrenome que não é string', () => {
      mockReq.body = {
        nome: 'João',
        sobrenome: 456,
        email: 'joao@exemplo.com'
      };

      validateCreateAluno(mockReq, mockRes, callNext);

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Erro de validação');
      expect(mockNext.called).toBe(false);
    });
  });

  describe('Validação do campo email (obrigatório)', () => {
    test('deve aceitar email válido', () => {
      mockReq.body = {
        nome: 'João',
        sobrenome: 'Silva',
        email: 'usuario@exemplo.com'
      };

      validateCreateAluno(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });

    test('deve rejeitar quando email não é fornecido', () => {
      mockReq.body = {
        nome: 'João',
        sobrenome: 'Silva'
      };

      validateCreateAluno(mockReq, mockRes, callNext);

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Erro de validação');
      expect(mockRes.data.errors).toBeDefined();
      expect(mockNext.called).toBe(false);
    });

    test('deve rejeitar email inválido', () => {
      mockReq.body = {
        nome: 'João',
        sobrenome: 'Silva',
        email: 'email-invalido'
      };

      validateCreateAluno(mockReq, mockRes, callNext);

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Erro de validação');
      expect(mockNext.called).toBe(false);
    });

    test('deve rejeitar email muito longo (mais de 200 caracteres)', () => {
      const longEmail = `${'a'.repeat(190)}@exemplo.com`; // Mais de 200 caracteres
      mockReq.body = {
        nome: 'João',
        sobrenome: 'Silva',
        email: longEmail
      };

      validateCreateAluno(mockReq, mockRes, callNext);

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Erro de validação');
      expect(mockNext.called).toBe(false);
    });

    test('deve aceitar diferentes formatos de email válidos', () => {
      const validEmails = [
        'aluno@escola.com',
        'teste.aluno@escola.com.br',
        'aluno+tag@escola.org',
        'aluno123@escola.edu'
      ];

      validEmails.forEach(email => {
        // Reset do mock para cada iteração
        mockNext.called = false;
        mockNext.callCount = 0;
        mockRes.statusCode = null;
        mockRes.data = null;

        mockReq.body = {
          nome: 'João',
          sobrenome: 'Silva',
          email
        };

        validateCreateAluno(mockReq, mockRes, callNext);

        expect(mockNext.called).toBe(true);
        expect(mockRes.statusCode).toBeNull();
      });
    });
  });

  describe('Validação do campo telefone (opcional)', () => {
    test('deve aceitar telefone válido com 10 dígitos', () => {
      mockReq.body = {
        nome: 'João',
        sobrenome: 'Silva',
        email: 'joao@exemplo.com',
        telefone: '1199999999'
      };

      validateCreateAluno(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });

    test('deve aceitar telefone válido com 11 dígitos', () => {
      mockReq.body = {
        nome: 'João',
        sobrenome: 'Silva',
        email: 'joao@exemplo.com',
        telefone: '11999999999'
      };

      validateCreateAluno(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });

    test('deve aceitar quando telefone não é fornecido (opcional)', () => {
      mockReq.body = {
        nome: 'João',
        sobrenome: 'Silva',
        email: 'joao@exemplo.com'
      };

      validateCreateAluno(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });

    test('deve rejeitar telefone muito curto (menos de 10 caracteres)', () => {
      mockReq.body = {
        nome: 'João',
        sobrenome: 'Silva',
        email: 'joao@exemplo.com',
        telefone: '119999999'
      };

      validateCreateAluno(mockReq, mockRes, callNext);

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Erro de validação');
      expect(mockNext.called).toBe(false);
    });

    test('deve rejeitar telefone muito longo (mais de 11 caracteres)', () => {
      mockReq.body = {
        nome: 'João',
        sobrenome: 'Silva',
        email: 'joao@exemplo.com',
        telefone: '119999999999'
      };

      validateCreateAluno(mockReq, mockRes, callNext);

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Erro de validação');
      expect(mockNext.called).toBe(false);
    });

    test('deve rejeitar telefone que não é string', () => {
      mockReq.body = {
        nome: 'João',
        sobrenome: 'Silva',
        email: 'joao@exemplo.com',
        telefone: 11999999999
      };

      validateCreateAluno(mockReq, mockRes, callNext);

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Erro de validação');
      expect(mockNext.called).toBe(false);
    });

    test('deve aceitar telefone undefined (opcional)', () => {
      mockReq.body = {
        nome: 'João',
        sobrenome: 'Silva',
        email: 'joao@exemplo.com',
        telefone: undefined
      };

      validateCreateAluno(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });

    test('deve aceitar telefone null (opcional)', () => {
      mockReq.body = {
        nome: 'João',
        sobrenome: 'Silva',
        email: 'joao@exemplo.com',
        telefone: null
      };

      validateCreateAluno(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });
  });

  describe('Validação do campo criador (opcional)', () => {
    test('deve aceitar criador válido', () => {
      mockReq.body = {
        nome: 'João',
        sobrenome: 'Silva',
        email: 'joao@exemplo.com',
        criador: 'admin-123'
      };

      validateCreateAluno(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });

    test('deve aceitar quando criador não é fornecido (opcional)', () => {
      mockReq.body = {
        nome: 'João',
        sobrenome: 'Silva',
        email: 'joao@exemplo.com'
      };

      validateCreateAluno(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });

    test('deve rejeitar criador muito curto (menos de 6 caracteres)', () => {
      mockReq.body = {
        nome: 'João',
        sobrenome: 'Silva',
        email: 'joao@exemplo.com',
        criador: 'admin'
      };

      validateCreateAluno(mockReq, mockRes, callNext);

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Erro de validação');
      expect(mockNext.called).toBe(false);
    });

    test('deve rejeitar criador muito longo (mais de 50 caracteres)', () => {
      mockReq.body = {
        nome: 'João',
        sobrenome: 'Silva',
        email: 'joao@exemplo.com',
        criador: 'a'.repeat(51)
      };

      validateCreateAluno(mockReq, mockRes, callNext);

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Erro de validação');
      expect(mockNext.called).toBe(false);
    });

    test('deve aceitar criador no limite mínimo (6 caracteres)', () => {
      mockReq.body = {
        nome: 'João',
        sobrenome: 'Silva',
        email: 'joao@exemplo.com',
        criador: 'admin1'
      };

      validateCreateAluno(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });

    test('deve aceitar criador no limite máximo (50 caracteres)', () => {
      mockReq.body = {
        nome: 'João',
        sobrenome: 'Silva',
        email: 'joao@exemplo.com',
        criador: 'a'.repeat(50)
      };

      validateCreateAluno(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });

    test('deve rejeitar criador que não é string', () => {
      mockReq.body = {
        nome: 'João',
        sobrenome: 'Silva',
        email: 'joao@exemplo.com',
        criador: 123456
      };

      validateCreateAluno(mockReq, mockRes, callNext);

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Erro de validação');
      expect(mockNext.called).toBe(false);
    });

    test('deve aceitar criador undefined (opcional)', () => {
      mockReq.body = {
        nome: 'João',
        sobrenome: 'Silva',
        email: 'joao@exemplo.com',
        criador: undefined
      };

      validateCreateAluno(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });

    test('deve aceitar criador null (opcional)', () => {
      mockReq.body = {
        nome: 'João',
        sobrenome: 'Silva',
        email: 'joao@exemplo.com',
        criador: null
      };

      validateCreateAluno(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });
  });

  describe('Validação do campo material (opcional)', () => {
    test('deve aceitar material válido', () => {
      mockReq.body = {
        nome: 'João',
        sobrenome: 'Silva',
        email: 'joao@exemplo.com',
        material: 'Livro Básico de Inglês, Caderno de Exercícios'
      };

      validateCreateAluno(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });

    test('deve aceitar material extenso', () => {
      mockReq.body = {
        nome: 'João',
        sobrenome: 'Silva',
        email: 'joao@exemplo.com',
        material: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(50)
      };

      validateCreateAluno(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });

    test('deve aceitar quando material não é fornecido (opcional)', () => {
      mockReq.body = {
        nome: 'João',
        sobrenome: 'Silva',
        email: 'joao@exemplo.com'
      };

      validateCreateAluno(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });

    test('deve aceitar material undefined (opcional)', () => {
      mockReq.body = {
        nome: 'João',
        sobrenome: 'Silva',
        email: 'joao@exemplo.com',
        material: undefined
      };

      validateCreateAluno(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });

    test('deve aceitar material null (opcional)', () => {
      mockReq.body = {
        nome: 'João',
        sobrenome: 'Silva',
        email: 'joao@exemplo.com',
        material: null
      };

      validateCreateAluno(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });

    test('deve aceitar material como string vazia', () => {
      mockReq.body = {
        nome: 'João',
        sobrenome: 'Silva',
        email: 'joao@exemplo.com',
        material: ''
      };

      validateCreateAluno(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });

    test('deve rejeitar material que não é string', () => {
      mockReq.body = {
        nome: 'João',
        sobrenome: 'Silva',
        email: 'joao@exemplo.com',
        material: 123
      };

      validateCreateAluno(mockReq, mockRes, callNext);

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Erro de validação');
      expect(mockNext.called).toBe(false);
    });
  });

  describe('Validação de múltiplos campos', () => {
    test('deve aceitar todos os campos válidos', () => {
      mockReq.body = {
        nome: 'João',
        sobrenome: 'Silva Santos',
        email: 'joao@escola.com',
        telefone: '11999999999',
        material: 'Livro de Inglês Avançado',
        criador: 'professor-123'
      };

      validateCreateAluno(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });

    test('deve aceitar apenas campos obrigatórios', () => {
      mockReq.body = {
        nome: 'Maria',
        sobrenome: 'Santos',
        email: 'maria@escola.com'
      };

      validateCreateAluno(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });

    test('deve rejeitar quando múltiplos campos são inválidos', () => {
      mockReq.body = {
        nome: 'Jo', // muito curto
        sobrenome: 'Si', // muito curto
        email: 'email-invalido', // formato inválido
        telefone: '123', // muito curto
        criador: 'short' // muito curto
      };

      validateCreateAluno(mockReq, mockRes, callNext);

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Erro de validação');
      expect(mockRes.data.errors).toBeDefined();
      expect(Array.isArray(mockRes.data.errors)).toBe(true);
      expect(mockRes.data.errors.length).toBeGreaterThan(1);
      expect(mockNext.called).toBe(false);
    });

    test('deve rejeitar quando campos obrigatórios estão faltando', () => {
      mockReq.body = {
        telefone: '11999999999',
        criador: 'professor-123'
      };

      validateCreateAluno(mockReq, mockRes, callNext);

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Erro de validação');
      expect(mockRes.data.errors).toBeDefined();
      expect(mockNext.called).toBe(false);
    });
  });

  describe('Propriedade req.validatedData', () => {
    test('deve definir req.validatedData quando validação passa', () => {
      mockReq.body = {
        nome: 'João',
        sobrenome: 'Silva',
        email: 'joao@escola.com',
        telefone: '11999999999',
        criador: 'professor-123'
      };

      validateCreateAluno(mockReq, mockRes, () => {
        mockNext.call();
      });

      expect(mockReq.validatedData).toBeDefined();
      expect(mockReq.validatedData.nome).toBe('João');
      expect(mockReq.validatedData.sobrenome).toBe('Silva');
      expect(mockReq.validatedData.email).toBe('joao@escola.com');
      expect(mockReq.validatedData.telefone).toBe('11999999999');
      expect(mockReq.validatedData.criador).toBe('professor-123');
    });

    test('não deve definir req.validatedData quando validação falha', () => {
      mockReq.body = {
        nome: 'Jo', // muito curto
        sobrenome: 'Silva',
        email: 'joao@escola.com'
      };

      validateCreateAluno(mockReq, mockRes, callNext);

      expect(mockReq.validatedData).toBeUndefined();
    });

    test('deve incluir apenas campos fornecidos em req.validatedData', () => {
      mockReq.body = {
        nome: 'João',
        sobrenome: 'Silva',
        email: 'joao@escola.com'
      };

      validateCreateAluno(mockReq, mockRes, () => {
        mockNext.call();
      });

      expect(mockReq.validatedData).toBeDefined();
      expect(mockReq.validatedData.nome).toBe('João');
      expect(mockReq.validatedData.sobrenome).toBe('Silva');
      expect(mockReq.validatedData.email).toBe('joao@escola.com');
      expect(mockReq.validatedData.telefone).toBeUndefined();
      expect(mockReq.validatedData.criador).toBeUndefined();
    });
  });

  describe('Tratamento de erros', () => {
    test('deve usar mensagem padrão quando req.t não existe para validação', () => {
      delete mockReq.t;
      mockReq.body = {
        nome: 'Jo', // inválido
        sobrenome: 'Silva',
        email: 'joao@escola.com'
      };

      validateCreateAluno(mockReq, mockRes, callNext);

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Erro de validação');
      expect(mockNext.called).toBe(false);
    });

    test('deve usar mensagem padrão quando req.t não existe para dados vazios', () => {
      delete mockReq.t;
      delete mockReq.body;

      validateCreateAluno(mockReq, mockRes, callNext);

      expect(mockRes.statusCode).toBe(400);
      expect(mockRes.data.message).toBe('Dados não fornecidos');
      expect(mockNext.called).toBe(false);
    });
  });

  describe('Casos extremos', () => {
    test('deve rejeitar campos obrigatórios como undefined', () => {
      mockReq.body = {
        nome: undefined,
        sobrenome: undefined,
        email: undefined,
        telefone: '11999999999',
        criador: 'professor-123'
      };

      validateCreateAluno(mockReq, mockRes, callNext);

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Erro de validação');
      expect(mockNext.called).toBe(false);
    });

    test('deve rejeitar campos obrigatórios como null', () => {
      mockReq.body = {
        nome: null,
        sobrenome: null,
        email: null,
        telefone: '11999999999',
        criador: 'professor-123'
      };

      validateCreateAluno(mockReq, mockRes, callNext);

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Erro de validação');
      expect(mockNext.called).toBe(false);
    });

    test('deve aceitar campos opcionais como undefined', () => {
      mockReq.body = {
        nome: 'João',
        sobrenome: 'Silva',
        email: 'joao@escola.com',
        telefone: undefined,
        criador: undefined
      };

      validateCreateAluno(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });

    test('deve aceitar campos opcionais como null', () => {
      mockReq.body = {
        nome: 'João',
        sobrenome: 'Silva',
        email: 'joao@escola.com',
        telefone: null,
        criador: null
      };

      validateCreateAluno(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });
  });

  describe('Cenários específicos do modelo Aluno', () => {
    test('deve aceitar dados típicos de aluno escolar', () => {
      mockReq.body = {
        nome: 'Pedro',
        sobrenome: 'Costa Silva',
        email: 'pedro.costa@escola.edu.br',
        telefone: '11987654321',
        criador: 'diretor-456'
      };

      validateCreateAluno(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });

    test('deve aceitar aluno sem telefone e criador', () => {
      mockReq.body = {
        nome: 'Ana Luiza',
        sobrenome: 'Oliveira Santos',
        email: 'ana.oliveira@estudante.com'
      };

      validateCreateAluno(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });

    test('deve rejeitar dados incompletos para criação', () => {
      mockReq.body = {
        nome: 'Carlos'
        // Faltando sobrenome e email obrigatórios
      };

      validateCreateAluno(mockReq, mockRes, callNext);

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Erro de validação');
      expect(mockNext.called).toBe(false);
    });

    test('deve validar formato de email educacional', () => {
      const educationalEmails = [
        'aluno@escola.edu.br',
        'estudante@faculdade.org',
        'matricula@instituto.gov.br',
        'aluno123@universidade.ac.uk'
      ];

      educationalEmails.forEach(email => {
        // Reset do mock para cada iteração
        mockNext.called = false;
        mockNext.callCount = 0;
        mockRes.statusCode = null;
        mockRes.data = null;

        mockReq.body = {
          nome: 'Aluno',
          sobrenome: 'Teste',
          email
        };

        validateCreateAluno(mockReq, mockRes, callNext);

        expect(mockNext.called).toBe(true);
        expect(mockRes.statusCode).toBeNull();
      });
    });
  });
});
