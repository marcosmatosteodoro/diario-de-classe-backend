import { validateUpdateAluno } from '../../../../src/middlewares/aluno/validateUpdateAluno.js';

describe('validateUpdateAluno middleware', () => {
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
      expect(typeof validateUpdateAluno).toBe('function');
    });

    test('deve aceitar três parâmetros (req, res, next)', () => {
      expect(validateUpdateAluno.length).toBe(3);
    });
  });

  describe('Validação de req.body', () => {
    test('deve retornar erro 400 quando req.body não existe', () => {
      delete mockReq.body;

      validateUpdateAluno(mockReq, mockRes, callNext);

      expect(mockRes.statusCode).toBe(400);
      expect(mockRes.data).toEqual({
        message: 'Dados não fornecidos'
      });
      expect(mockNext.called).toBe(false);
    });

    test('deve retornar erro 400 quando req.body é null', () => {
      mockReq.body = null;

      validateUpdateAluno(mockReq, mockRes, callNext);

      expect(mockRes.statusCode).toBe(400);
      expect(mockRes.data).toEqual({
        message: 'Dados não fornecidos'
      });
      expect(mockNext.called).toBe(false);
    });

    test('deve aceitar quando req.body é um objeto vazio (todos os campos opcionais)', () => {
      mockReq.body = {};

      validateUpdateAluno(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });
  });

  describe('Validação do campo nome (opcional)', () => {
    test('deve aceitar nome válido', () => {
      mockReq.body = {
        nome: 'João Silva'
      };

      validateUpdateAluno(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });

    test('deve aceitar quando nome não é fornecido (opcional)', () => {
      mockReq.body = {
        sobrenome: 'Silva'
      };

      validateUpdateAluno(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });

    test('deve rejeitar nome muito curto (menos de 3 caracteres)', () => {
      mockReq.body = {
        nome: 'Jo'
      };

      validateUpdateAluno(mockReq, mockRes, callNext);

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Erro de validação');
      expect(mockRes.data.errors).toBeDefined();
      expect(mockNext.called).toBe(false);
    });

    test('deve rejeitar nome muito longo (mais de 200 caracteres)', () => {
      mockReq.body = {
        nome: 'a'.repeat(201)
      };

      validateUpdateAluno(mockReq, mockRes, callNext);

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Erro de validação');
      expect(mockRes.data.errors).toBeDefined();
      expect(mockNext.called).toBe(false);
    });

    test('deve aceitar nome no limite mínimo (3 caracteres)', () => {
      mockReq.body = {
        nome: 'Ana'
      };

      validateUpdateAluno(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });

    test('deve aceitar nome no limite máximo (200 caracteres)', () => {
      mockReq.body = {
        nome: 'a'.repeat(200)
      };

      validateUpdateAluno(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });

    test('deve rejeitar nome que não é string', () => {
      mockReq.body = {
        nome: 123
      };

      validateUpdateAluno(mockReq, mockRes, callNext);

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Erro de validação');
      expect(mockNext.called).toBe(false);
    });

    test('deve aceitar nome undefined (opcional)', () => {
      mockReq.body = {
        nome: undefined,
        sobrenome: 'Silva'
      };

      validateUpdateAluno(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });

    test('deve aceitar nome null (opcional)', () => {
      mockReq.body = {
        nome: null,
        sobrenome: 'Silva'
      };

      validateUpdateAluno(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });
  });

  describe('Validação do campo sobrenome (opcional)', () => {
    test('deve aceitar sobrenome válido', () => {
      mockReq.body = {
        sobrenome: 'Silva Santos'
      };

      validateUpdateAluno(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });

    test('deve aceitar quando sobrenome não é fornecido (opcional)', () => {
      mockReq.body = {
        nome: 'João'
      };

      validateUpdateAluno(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });

    test('deve rejeitar sobrenome muito curto (menos de 3 caracteres)', () => {
      mockReq.body = {
        sobrenome: 'Si'
      };

      validateUpdateAluno(mockReq, mockRes, callNext);

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Erro de validação');
      expect(mockNext.called).toBe(false);
    });

    test('deve rejeitar sobrenome muito longo (mais de 200 caracteres)', () => {
      mockReq.body = {
        sobrenome: 'b'.repeat(201)
      };

      validateUpdateAluno(mockReq, mockRes, callNext);

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Erro de validação');
      expect(mockNext.called).toBe(false);
    });

    test('deve rejeitar sobrenome que não é string', () => {
      mockReq.body = {
        sobrenome: 456
      };

      validateUpdateAluno(mockReq, mockRes, callNext);

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Erro de validação');
      expect(mockNext.called).toBe(false);
    });

    test('deve aceitar sobrenome undefined (opcional)', () => {
      mockReq.body = {
        sobrenome: undefined,
        nome: 'João'
      };

      validateUpdateAluno(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });

    test('deve aceitar sobrenome null (opcional)', () => {
      mockReq.body = {
        sobrenome: null,
        nome: 'João'
      };

      validateUpdateAluno(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });
  });

  describe('Validação do campo email (opcional)', () => {
    test('deve aceitar email válido', () => {
      mockReq.body = {
        email: 'usuario@exemplo.com'
      };

      validateUpdateAluno(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });

    test('deve aceitar quando email não é fornecido (opcional)', () => {
      mockReq.body = {
        nome: 'João'
      };

      validateUpdateAluno(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });

    test('deve rejeitar email inválido', () => {
      mockReq.body = {
        email: 'email-invalido'
      };

      validateUpdateAluno(mockReq, mockRes, callNext);

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Erro de validação');
      expect(mockNext.called).toBe(false);
    });

    test('deve rejeitar email muito longo (mais de 200 caracteres)', () => {
      const longEmail = `${'a'.repeat(190)}@exemplo.com`; // Mais de 200 caracteres
      mockReq.body = {
        email: longEmail
      };

      validateUpdateAluno(mockReq, mockRes, callNext);

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
          email
        };

        validateUpdateAluno(mockReq, mockRes, callNext);

        expect(mockNext.called).toBe(true);
        expect(mockRes.statusCode).toBeNull();
      });
    });

    test('deve aceitar email undefined (opcional)', () => {
      mockReq.body = {
        email: undefined,
        nome: 'João'
      };

      validateUpdateAluno(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });

    test('deve aceitar email null (opcional)', () => {
      mockReq.body = {
        email: null,
        nome: 'João'
      };

      validateUpdateAluno(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });
  });

  describe('Validação do campo telefone (opcional)', () => {
    test('deve aceitar telefone válido com 10 dígitos', () => {
      mockReq.body = {
        telefone: '1199999999'
      };

      validateUpdateAluno(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });

    test('deve aceitar telefone válido com 11 dígitos', () => {
      mockReq.body = {
        telefone: '11999999999'
      };

      validateUpdateAluno(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });

    test('deve aceitar quando telefone não é fornecido (opcional)', () => {
      mockReq.body = {
        nome: 'João'
      };

      validateUpdateAluno(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });

    test('deve rejeitar telefone muito curto (menos de 10 caracteres)', () => {
      mockReq.body = {
        telefone: '119999999'
      };

      validateUpdateAluno(mockReq, mockRes, callNext);

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Erro de validação');
      expect(mockNext.called).toBe(false);
    });

    test('deve rejeitar telefone muito longo (mais de 11 caracteres)', () => {
      mockReq.body = {
        telefone: '119999999999'
      };

      validateUpdateAluno(mockReq, mockRes, callNext);

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Erro de validação');
      expect(mockNext.called).toBe(false);
    });

    test('deve rejeitar telefone que não é string', () => {
      mockReq.body = {
        telefone: 11999999999
      };

      validateUpdateAluno(mockReq, mockRes, callNext);

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Erro de validação');
      expect(mockNext.called).toBe(false);
    });

    test('deve aceitar telefone undefined (opcional)', () => {
      mockReq.body = {
        telefone: undefined,
        nome: 'João'
      };

      validateUpdateAluno(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });

    test('deve aceitar telefone null (opcional)', () => {
      mockReq.body = {
        telefone: null,
        nome: 'João'
      };

      validateUpdateAluno(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });
  });

  describe('Validação do campo criador (opcional)', () => {
    test('deve aceitar criador válido', () => {
      mockReq.body = {
        criador: 'admin-123'
      };

      validateUpdateAluno(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });

    test('deve aceitar quando criador não é fornecido (opcional)', () => {
      mockReq.body = {
        nome: 'João'
      };

      validateUpdateAluno(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });

    test('deve rejeitar criador muito curto (menos de 6 caracteres)', () => {
      mockReq.body = {
        criador: 'admin'
      };

      validateUpdateAluno(mockReq, mockRes, callNext);

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Erro de validação');
      expect(mockNext.called).toBe(false);
    });

    test('deve rejeitar criador muito longo (mais de 50 caracteres)', () => {
      mockReq.body = {
        criador: 'a'.repeat(51)
      };

      validateUpdateAluno(mockReq, mockRes, callNext);

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Erro de validação');
      expect(mockNext.called).toBe(false);
    });

    test('deve aceitar criador no limite mínimo (6 caracteres)', () => {
      mockReq.body = {
        criador: 'admin1'
      };

      validateUpdateAluno(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });

    test('deve aceitar criador no limite máximo (50 caracteres)', () => {
      mockReq.body = {
        criador: 'a'.repeat(50)
      };

      validateUpdateAluno(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });

    test('deve rejeitar criador que não é string', () => {
      mockReq.body = {
        criador: 123456
      };

      validateUpdateAluno(mockReq, mockRes, callNext);

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Erro de validação');
      expect(mockNext.called).toBe(false);
    });

    test('deve aceitar criador undefined (opcional)', () => {
      mockReq.body = {
        criador: undefined,
        nome: 'João'
      };

      validateUpdateAluno(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });

    test('deve aceitar criador null (opcional)', () => {
      mockReq.body = {
        criador: null,
        nome: 'João'
      };

      validateUpdateAluno(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });
  });

  describe('Validação de múltiplos campos', () => {
    test('deve aceitar todos os campos válidos', () => {
      mockReq.body = {
        nome: 'João',
        sobrenome: 'Silva Santos',
        email: 'joao@escola.com',
        telefone: '11999999999',
        criador: 'professor-123'
      };

      validateUpdateAluno(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });

    test('deve aceitar apenas um campo válido', () => {
      mockReq.body = {
        nome: 'Maria'
      };

      validateUpdateAluno(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });

    test('deve aceitar apenas alguns campos válidos', () => {
      mockReq.body = {
        nome: 'Pedro',
        email: 'pedro@escola.com'
      };

      validateUpdateAluno(mockReq, mockRes, callNext);

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

      validateUpdateAluno(mockReq, mockRes, callNext);

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Erro de validação');
      expect(mockRes.data.errors).toBeDefined();
      expect(Array.isArray(mockRes.data.errors)).toBe(true);
      expect(mockRes.data.errors.length).toBeGreaterThan(1);
      expect(mockNext.called).toBe(false);
    });

    test('deve aceitar atualização parcial com campos undefined', () => {
      mockReq.body = {
        nome: 'João',
        sobrenome: undefined,
        email: null,
        telefone: '11999999999'
      };

      validateUpdateAluno(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
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

      validateUpdateAluno(mockReq, mockRes, () => {
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
        nome: 'Jo' // muito curto
      };

      validateUpdateAluno(mockReq, mockRes, callNext);

      expect(mockReq.validatedData).toBeUndefined();
    });

    test('deve incluir apenas campos fornecidos em req.validatedData', () => {
      mockReq.body = {
        nome: 'João',
        email: 'joao@escola.com'
      };

      validateUpdateAluno(mockReq, mockRes, () => {
        mockNext.call();
      });

      expect(mockReq.validatedData).toBeDefined();
      expect(mockReq.validatedData.nome).toBe('João');
      expect(mockReq.validatedData.email).toBe('joao@escola.com');
      expect(mockReq.validatedData.sobrenome).toBeUndefined();
      expect(mockReq.validatedData.telefone).toBeUndefined();
      expect(mockReq.validatedData.criador).toBeUndefined();
    });

    test('deve incluir campos null em req.validatedData', () => {
      mockReq.body = {
        nome: 'João',
        telefone: null,
        criador: null
      };

      validateUpdateAluno(mockReq, mockRes, () => {
        mockNext.call();
      });

      expect(mockReq.validatedData).toBeDefined();
      expect(mockReq.validatedData.nome).toBe('João');
      expect(mockReq.validatedData.telefone).toBeNull();
      expect(mockReq.validatedData.criador).toBeNull();
    });
  });

  describe('Tratamento de erros', () => {
    test('deve usar mensagem padrão quando req.t não existe para validação', () => {
      delete mockReq.t;
      mockReq.body = {
        nome: 'Jo' // inválido
      };

      validateUpdateAluno(mockReq, mockRes, callNext);

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Erro de validação');
      expect(mockNext.called).toBe(false);
    });

    test('deve usar mensagem padrão quando req.t não existe para dados vazios', () => {
      delete mockReq.t;
      delete mockReq.body;

      validateUpdateAluno(mockReq, mockRes, callNext);

      expect(mockRes.statusCode).toBe(400);
      expect(mockRes.data.message).toBe('Dados não fornecidos');
      expect(mockNext.called).toBe(false);
    });
  });

  describe('Casos extremos para atualização', () => {
    test('deve aceitar todos os campos como undefined', () => {
      mockReq.body = {
        nome: undefined,
        sobrenome: undefined,
        email: undefined,
        telefone: undefined,
        criador: undefined
      };

      validateUpdateAluno(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });

    test('deve aceitar todos os campos como null', () => {
      mockReq.body = {
        nome: null,
        sobrenome: null,
        email: null,
        telefone: null,
        criador: null
      };

      validateUpdateAluno(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });

    test('deve aceitar mistura de undefined e null', () => {
      mockReq.body = {
        nome: 'João',
        sobrenome: undefined,
        email: null,
        telefone: undefined,
        criador: 'admin-123'
      };

      validateUpdateAluno(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });

    test('deve rejeitar quando pelo menos um campo é inválido', () => {
      mockReq.body = {
        nome: 'João Silva', // válido
        sobrenome: 'Santos', // válido
        email: 'joao@escola.com', // válido
        telefone: '123', // inválido - muito curto
        criador: 'professor-123' // válido
      };

      validateUpdateAluno(mockReq, mockRes, callNext);

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Erro de validação');
      expect(mockNext.called).toBe(false);
    });
  });

  describe('Cenários específicos do modelo Aluno - Atualização', () => {
    test('deve aceitar atualização apenas do nome', () => {
      mockReq.body = {
        nome: 'Pedro Carlos'
      };

      validateUpdateAluno(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });

    test('deve aceitar atualização apenas do email', () => {
      mockReq.body = {
        email: 'novo.email@escola.edu.br'
      };

      validateUpdateAluno(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });

    test('deve aceitar atualização apenas do telefone', () => {
      mockReq.body = {
        telefone: '11987654321'
      };

      validateUpdateAluno(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });

    test('deve aceitar remoção de campos opcionais (null)', () => {
      mockReq.body = {
        telefone: null,
        criador: null
      };

      validateUpdateAluno(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });

    test('deve validar formato de email educacional na atualização', () => {
      const educationalEmails = [
        'aluno.atualizado@escola.edu.br',
        'novo.estudante@faculdade.org',
        'matricula.nova@instituto.gov.br',
        'aluno.modificado@universidade.ac.uk'
      ];

      educationalEmails.forEach(email => {
        // Reset do mock para cada iteração
        mockNext.called = false;
        mockNext.callCount = 0;
        mockRes.statusCode = null;
        mockRes.data = null;

        mockReq.body = {
          email
        };

        validateUpdateAluno(mockReq, mockRes, callNext);

        expect(mockNext.called).toBe(true);
        expect(mockRes.statusCode).toBeNull();
      });
    });

    test('deve permitir atualização completa de dados do aluno', () => {
      mockReq.body = {
        nome: 'Ana Luiza',
        sobrenome: 'Costa Ferreira',
        email: 'ana.luiza@escola.edu.br',
        telefone: '11998765432',
        criador: 'coordenador-456'
      };

      validateUpdateAluno(mockReq, mockRes, callNext);

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });
  });
});
