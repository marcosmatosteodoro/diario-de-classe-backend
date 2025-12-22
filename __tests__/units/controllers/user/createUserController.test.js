import { CreateUserController } from '../../../../src/controllers/user/createUserController.js';
import AbstractController from '../../../../src/controllers/abstractController.js';
import * as IsUserEmailExistsService from '../../../../src/services/user/isUserEmailExistsService.js';
import * as CreateUserService from '../../../../src/services/user/createUserService.js';
import * as CreateDisponibilidadeProfessorService from '../../../../src/services/disponibilidadeProfessor/createDisponibilidadeProfessorService.js';

describe('CreateUserController', () => {
  let controller, mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      body: {
        nome: 'João',
        sobrenome: 'Silva',
        email: 'joao@teste.com',
        telefone: '11999999999',
        senha: 'senha123',
        resetarSenha: false,
        permissao: 'user'
      },
      t: key => {
        const translations = {
          'users.create.email_exists': 'Este email já está em uso',
          'users.create.error': 'Erro ao criar usuário'
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

    controller = new CreateUserController(mockReq, mockRes);
  });

  describe('Inicialização', () => {
    test('deve herdar de AbstractController', () => {
      expect(controller).toBeInstanceOf(AbstractController);
    });

    test('deve ter acesso ao req e res', () => {
      expect(controller.req).toBe(mockReq);
      expect(controller.res).toBe(mockRes);
    });

    test('deve ter propriedades inicializadas corretamente', () => {
      expect(controller.req.body).toEqual(mockReq.body);
      expect(typeof controller.req.t).toBe('function');
    });
  });

  describe('Métodos e estrutura', () => {
    test('deve ter método execute', () => {
      expect(typeof controller.execute).toBe('function');
    });

    test('deve ter método handle estático', () => {
      expect(typeof CreateUserController.handle).toBe('function');
    });

    test('deve ter acesso aos dados do corpo da requisição', () => {
      expect(controller.req.body.nome).toBe('João');
      expect(controller.req.body.email).toBe('joao@teste.com');
    });

    test('deve ter acesso à função de tradução', () => {
      expect(controller.req.t('users.create.email_exists')).toBe('Este email já está em uso');
    });
  });

  describe('Validação de dados', () => {
    test('deve trabalhar com dados mínimos obrigatórios', () => {
      const minimalReq = {
        body: {
          nome: 'João',
          email: 'joao@teste.com',
          senha: 'senha123'
        },
        t: mockReq.t
      };

      const minimalController = new CreateUserController(minimalReq, mockRes);

      expect(minimalController.req.body.nome).toBe('João');
      expect(minimalController.req.body.email).toBe('joao@teste.com');
      expect(minimalController.req.body.senha).toBe('senha123');
    });

    test('deve trabalhar com dados completos', () => {
      expect(controller.req.body.nome).toBe('João');
      expect(controller.req.body.sobrenome).toBe('Silva');
      expect(controller.req.body.email).toBe('joao@teste.com');
      expect(controller.req.body.telefone).toBe('11999999999');
      expect(controller.req.body.senha).toBe('senha123');
      expect(controller.req.body.resetarSenha).toBe(false);
      expect(controller.req.body.permissao).toBe('user');
    });
  });

  describe('Resposta HTTP', () => {
    test('res deve ter método status', () => {
      expect(typeof mockRes.status).toBe('function');
    });

    test('res deve ter método json', () => {
      expect(typeof mockRes.json).toBe('function');
    });

    test('status deve retornar o próprio objeto para encadeamento', () => {
      const result = mockRes.status(200);
      expect(result).toBe(mockRes);
    });

    test('json deve retornar o próprio objeto para encadeamento', () => {
      const result = mockRes.json({ message: 'test' });
      expect(result).toBe(mockRes);
    });

    test('deve permitir encadeamento status().json()', () => {
      mockRes.status(201).json({ message: 'Usuário criado' });

      expect(mockRes.statusCode).toBe(201);
      expect(mockRes.data).toEqual({ message: 'Usuário criado' });
    });
  });

  describe('Tradução e internacionalização', () => {
    test('deve traduzir mensagem de email existente', () => {
      const message = controller.req.t('users.create.email_exists');
      expect(message).toBe('Este email já está em uso');
    });

    test('deve traduzir mensagem de erro', () => {
      const message = controller.req.t('users.create.error');
      expect(message).toBe('Erro ao criar usuário');
    });

    test('deve retornar chave se tradução não existir', () => {
      const message = controller.req.t('chave.inexistente');
      expect(message).toBe('chave.inexistente');
    });
  });

  describe('Tipos de dados', () => {
    test('deve lidar com string vazia no nome', () => {
      const emptyNameReq = {
        ...mockReq,
        body: { ...mockReq.body, nome: '' }
      };

      const emptyNameController = new CreateUserController(emptyNameReq, mockRes);
      expect(emptyNameController.req.body.nome).toBe('');
    });

    test('deve lidar com boolean resetarSenha', () => {
      expect(typeof controller.req.body.resetarSenha).toBe('boolean');
      expect(controller.req.body.resetarSenha).toBe(false);
    });

    test('deve lidar com permissao como string', () => {
      expect(typeof controller.req.body.permissao).toBe('string');
      expect(controller.req.body.permissao).toBe('user');
    });
  });

  describe('Cenários de email', () => {
    test('deve trabalhar com email em minúsculas', () => {
      const lowerCaseReq = {
        ...mockReq,
        body: { ...mockReq.body, email: 'joao@teste.com' }
      };

      const lowerCaseController = new CreateUserController(lowerCaseReq, mockRes);
      expect(lowerCaseController.req.body.email).toBe('joao@teste.com');
    });

    test('deve trabalhar com email em maiúsculas', () => {
      const upperCaseReq = {
        ...mockReq,
        body: { ...mockReq.body, email: 'JOAO@TESTE.COM' }
      };

      const upperCaseController = new CreateUserController(upperCaseReq, mockRes);
      expect(upperCaseController.req.body.email).toBe('JOAO@TESTE.COM');
    });
  });

  describe('Estados do objeto response', () => {
    test('deve inicializar status como null', () => {
      expect(mockRes.statusCode).toBeNull();
    });

    test('deve inicializar data como null', () => {
      expect(mockRes.data).toBeNull();
    });

    test('deve permitir definir diferentes códigos de status', () => {
      mockRes.status(400);
      expect(mockRes.statusCode).toBe(400);

      mockRes.status(201);
      expect(mockRes.statusCode).toBe(201);

      mockRes.status(409);
      expect(mockRes.statusCode).toBe(409);
    });
  });

  describe('Execute behavior', () => {
    let originalIsEmailHandle;
    let originalCreateUserHandle;
    let originalCreateDisponibilidadeHandle;

    afterEach(() => {
      if (originalIsEmailHandle !== undefined) {
        IsUserEmailExistsService.IsUserEmailExistsService.handle = originalIsEmailHandle;
      }
      if (originalCreateUserHandle !== undefined) {
        CreateUserService.CreateUserService.handle = originalCreateUserHandle;
      }
      if (originalCreateDisponibilidadeHandle !== undefined) {
        CreateDisponibilidadeProfessorService.CreateDisponibilidadeProfessorService.handle =
          originalCreateDisponibilidadeHandle;
      }
    });

    test('returns 409 when email already exists', async () => {
      // mock IsUserEmailExistsService.handle to true
      originalIsEmailHandle = IsUserEmailExistsService.IsUserEmailExistsService.handle;
      IsUserEmailExistsService.IsUserEmailExistsService.handle = async () => true;

      const controllerExec = new CreateUserController(mockReq, mockRes);
      await controllerExec.execute();

      expect(mockRes.statusCode).toBe(409);
      expect(mockRes.data).toEqual({ message: 'Este email já está em uso' });
    });

    test('creates user and disponibilidades and returns 201', async () => {
      // mock IsUserEmailExistsService.handle -> false
      originalIsEmailHandle = IsUserEmailExistsService.IsUserEmailExistsService.handle;
      IsUserEmailExistsService.IsUserEmailExistsService.handle = async () => false;

      // mock CreateUserService.handle -> returns user with empty disponibilidades
      originalCreateUserHandle = CreateUserService.CreateUserService.handle;
      CreateUserService.CreateUserService.handle = async body => ({
        id: 'new-user-id',
        ...body,
        disponibilidades: []
      });

      // mock CreateDisponibilidadeProfessorService.handle -> returns disponibilidade object
      originalCreateDisponibilidadeHandle =
        CreateDisponibilidadeProfessorService.CreateDisponibilidadeProfessorService.handle;
      let seq = 0;
      CreateDisponibilidadeProfessorService.CreateDisponibilidadeProfessorService.handle =
        async dispon => {
          seq += 1;
          return { id: `d-${seq}`, ...dispon };
        };

      const controllerExec = new CreateUserController(mockReq, mockRes);
      await controllerExec.execute();

      expect(mockRes.statusCode).toBe(201);
      expect(mockRes.data).toBeDefined();
      expect(Array.isArray(mockRes.data.disponibilidades)).toBe(true);
      // diasAtivos (5) + diasInativos (2) = 7
      expect(mockRes.data.disponibilidades.length).toBe(7);
      // verify each disponibilidade has userId set to new-user-id
      expect(mockRes.data.disponibilidades.every(d => d.userId === 'new-user-id')).toBe(true);
    });
  });
});
