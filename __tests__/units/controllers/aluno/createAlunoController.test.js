import { CreateAlunoController } from '../../../../src/controllers/aluno/createAlunoController.js';
import { CreateAlunoService } from '../../../../src/services/aluno/createAlunoService.js';
import { IsAlunoEmailExistsService } from '../../../../src/services/aluno/isAlunoEmailExistsService.js';
import AbstractController from '../../../../src/controllers/abstractController.js';

describe('CreateAlunoController', () => {
  let controller, mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      body: {
        nome: 'João',
        sobrenome: 'Silva',
        email: 'joao@teste.com',
        telefone: '11999999999',
        endereco: 'Rua das Flores, 123',
        dataNascimento: '1990-01-01',
        observacoes: 'Aluno dedicado'
      },
      t: key => {
        const translations = {
          'alunos.create.email_exists': 'Este email já está em uso',
          'alunos.create.error': 'Erro ao criar aluno'
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

    controller = new CreateAlunoController(mockReq, mockRes);
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

    test('deve criar uma instância com req e res', () => {
      expect(controller).toBeInstanceOf(CreateAlunoController);
      expect(controller.req).toBe(mockReq);
      expect(controller.res).toBe(mockRes);
    });
  });

  describe('Métodos e estrutura', () => {
    test('deve ter método execute', () => {
      expect(typeof controller.execute).toBe('function');
    });

    test('deve ter método handle estático', () => {
      expect(typeof CreateAlunoController.handle).toBe('function');
    });

    test('deve ter acesso aos dados do corpo da requisição', () => {
      expect(controller.req.body.nome).toBe('João');
      expect(controller.req.body.email).toBe('joao@teste.com');
    });

    test('deve ter acesso à função de tradução', () => {
      expect(controller.req.t('alunos.create.email_exists')).toBe('Este email já está em uso');
    });

    test('deve ter método execute como função assíncrona', () => {
      expect(typeof controller.execute).toBe('function');
      expect(controller.execute.constructor.name).toBe('AsyncFunction');
    });
  });

  describe('Validação de dados', () => {
    test('deve trabalhar com dados mínimos obrigatórios', () => {
      const minimalReq = {
        body: {
          nome: 'João',
          sobrenome: 'Silva',
          email: 'joao@teste.com',
          telefone: '11999999999'
        },
        t: mockReq.t
      };

      const minimalController = new CreateAlunoController(minimalReq, mockRes);

      expect(minimalController.req.body.nome).toBe('João');
      expect(minimalController.req.body.sobrenome).toBe('Silva');
      expect(minimalController.req.body.email).toBe('joao@teste.com');
      expect(minimalController.req.body.telefone).toBe('11999999999');
    });

    test('deve trabalhar com dados completos', () => {
      expect(controller.req.body.nome).toBe('João');
      expect(controller.req.body.sobrenome).toBe('Silva');
      expect(controller.req.body.email).toBe('joao@teste.com');
      expect(controller.req.body.telefone).toBe('11999999999');
      expect(controller.req.body.endereco).toBe('Rua das Flores, 123');
      expect(controller.req.body.dataNascimento).toBe('1990-01-01');
      expect(controller.req.body.observacoes).toBe('Aluno dedicado');
    });

    test('deve trabalhar com campos opcionais vazios', () => {
      const optionalEmptyReq = {
        body: {
          nome: 'Maria',
          sobrenome: 'Santos',
          email: 'maria@teste.com',
          telefone: '11888888888',
          endereco: '',
          dataNascimento: null,
          observacoes: undefined
        },
        t: mockReq.t
      };

      const optionalController = new CreateAlunoController(optionalEmptyReq, mockRes);

      expect(optionalController.req.body.nome).toBe('Maria');
      expect(optionalController.req.body.endereco).toBe('');
      expect(optionalController.req.body.dataNascimento).toBeNull();
      expect(optionalController.req.body.observacoes).toBeUndefined();
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
      mockRes.status(201).json({ message: 'Aluno criado' });

      expect(mockRes.statusCode).toBe(201);
      expect(mockRes.data).toEqual({ message: 'Aluno criado' });
    });
  });

  describe('Tradução e internacionalização', () => {
    test('deve traduzir mensagem de email existente', () => {
      const message = controller.req.t('alunos.create.email_exists');
      expect(message).toBe('Este email já está em uso');
    });

    test('deve traduzir mensagem de erro', () => {
      const message = controller.req.t('alunos.create.error');
      expect(message).toBe('Erro ao criar aluno');
    });

    test('deve retornar chave se tradução não existir', () => {
      const message = controller.req.t('chave.inexistente');
      expect(message).toBe('chave.inexistente');
    });

    test('deve usar chave de tradução correta para email existente', () => {
      let translationKey = '';
      mockReq.t = key => {
        translationKey = key;
        return 'Este email já está em uso';
      };

      controller.req.t('alunos.create.email_exists');
      expect(translationKey).toBe('alunos.create.email_exists');
    });
  });

  describe('Tipos de dados', () => {
    test('deve lidar com string vazia no nome', () => {
      const emptyNameReq = {
        ...mockReq,
        body: { ...mockReq.body, nome: '' }
      };

      const emptyNameController = new CreateAlunoController(emptyNameReq, mockRes);
      expect(emptyNameController.req.body.nome).toBe('');
    });

    test('deve lidar com telefone como string', () => {
      expect(typeof controller.req.body.telefone).toBe('string');
      expect(controller.req.body.telefone).toBe('11999999999');
    });

    test('deve lidar com data de nascimento como string', () => {
      expect(typeof controller.req.body.dataNascimento).toBe('string');
      expect(controller.req.body.dataNascimento).toBe('1990-01-01');
    });

    test('deve lidar com observações como string', () => {
      expect(typeof controller.req.body.observacoes).toBe('string');
      expect(controller.req.body.observacoes).toBe('Aluno dedicado');
    });
  });

  describe('Cenários de email', () => {
    test('deve trabalhar com email em minúsculas', () => {
      const lowerCaseReq = {
        ...mockReq,
        body: { ...mockReq.body, email: 'joao@teste.com' }
      };

      const lowerCaseController = new CreateAlunoController(lowerCaseReq, mockRes);
      expect(lowerCaseController.req.body.email).toBe('joao@teste.com');
    });

    test('deve trabalhar com email em maiúsculas', () => {
      const upperCaseReq = {
        ...mockReq,
        body: { ...mockReq.body, email: 'JOAO@TESTE.COM' }
      };

      const upperCaseController = new CreateAlunoController(upperCaseReq, mockRes);
      expect(upperCaseController.req.body.email).toBe('JOAO@TESTE.COM');
    });

    test('deve trabalhar com diferentes formatos de email', () => {
      const emails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'test+tag@example.org',
        'user123@test-domain.com'
      ];

      emails.forEach(email => {
        const emailReq = {
          ...mockReq,
          body: { ...mockReq.body, email }
        };

        const emailController = new CreateAlunoController(emailReq, mockRes);
        expect(emailController.req.body.email).toBe(email);
      });
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

  describe('Método execute() - Funcionalidade', () => {
    test('deve retornar 409 quando email já existe', async () => {
      const originalIsEmailExists = IsAlunoEmailExistsService.handle;
      IsAlunoEmailExistsService.handle = async () => true;

      await controller.execute();

      expect(mockRes.statusCode).toBe(409);
      expect(mockRes.data).toEqual({
        message: 'Este email já está em uso'
      });

      IsAlunoEmailExistsService.handle = originalIsEmailExists;
    });

    test('deve criar aluno e retornar 201 quando email não existe', async () => {
      const originalIsEmailExists = IsAlunoEmailExistsService.handle;
      const originalCreateAluno = CreateAlunoService.handle;

      const mockAluno = {
        id: 1,
        nome: 'João',
        sobrenome: 'Silva',
        email: 'joao@teste.com'
      };

      IsAlunoEmailExistsService.handle = async () => false;
      CreateAlunoService.handle = async () => mockAluno;

      await controller.execute();

      expect(mockRes.statusCode).toBe(201);
      expect(mockRes.data).toEqual(mockAluno);

      IsAlunoEmailExistsService.handle = originalIsEmailExists;
      CreateAlunoService.handle = originalCreateAluno;
    });

    test('deve tratar erro e chamar handleError', async () => {
      const originalIsEmailExists = IsAlunoEmailExistsService.handle;
      const testError = new Error('Database error');

      IsAlunoEmailExistsService.handle = async () => {
        throw testError;
      };

      let handledError;
      let handledTranslationKey;

      controller.handleError = (error, translationKey) => {
        handledError = error;
        handledTranslationKey = translationKey;
      };

      await controller.execute();

      expect(handledError).toBe(testError);
      expect(handledTranslationKey).toBe('alunos.create.error');

      IsAlunoEmailExistsService.handle = originalIsEmailExists;
    });

    test('deve passar dados corretos para IsAlunoEmailExistsService', async () => {
      const originalIsEmailExists = IsAlunoEmailExistsService.handle;
      let receivedEmail = null;

      IsAlunoEmailExistsService.handle = async email => {
        receivedEmail = email;
        return false;
      };

      const originalCreateAluno = CreateAlunoService.handle;
      CreateAlunoService.handle = async () => ({ id: 1 });

      await controller.execute();

      expect(receivedEmail).toBe('joao@teste.com');

      IsAlunoEmailExistsService.handle = originalIsEmailExists;
      CreateAlunoService.handle = originalCreateAluno;
    });

    test('deve passar dados corretos para CreateAlunoService', async () => {
      const originalIsEmailExists = IsAlunoEmailExistsService.handle;
      const originalCreateAluno = CreateAlunoService.handle;

      let receivedData = null;

      IsAlunoEmailExistsService.handle = async () => false;
      CreateAlunoService.handle = async data => {
        receivedData = data;
        return { id: 1, ...data };
      };

      await controller.execute();

      expect(receivedData).toEqual(mockReq.body);

      IsAlunoEmailExistsService.handle = originalIsEmailExists;
      CreateAlunoService.handle = originalCreateAluno;
    });
  });

  describe('Método estático handle()', () => {
    test('deve ser uma função estática', () => {
      expect(typeof CreateAlunoController.handle).toBe('function');
      expect(CreateAlunoController.handle).not.toBe(AbstractController.handle);
    });

    test('deve executar através do método estático', async () => {
      const originalIsEmailExists = IsAlunoEmailExistsService.handle;
      const originalCreateAluno = CreateAlunoService.handle;

      const mockAluno = { id: 1, nome: 'João' };

      IsAlunoEmailExistsService.handle = async () => false;
      CreateAlunoService.handle = async () => mockAluno;

      await CreateAlunoController.handle(mockReq, mockRes);

      expect(mockRes.statusCode).toBe(201);
      expect(mockRes.data).toEqual(mockAluno);

      IsAlunoEmailExistsService.handle = originalIsEmailExists;
      CreateAlunoService.handle = originalCreateAluno;
    });

    test('deve criar nova instância do controller a cada chamada', async () => {
      const originalIsEmailExists = IsAlunoEmailExistsService.handle;
      const originalCreateAluno = CreateAlunoService.handle;

      IsAlunoEmailExistsService.handle = async () => false;
      CreateAlunoService.handle = async () => ({ id: 1 });

      await CreateAlunoController.handle(mockReq, mockRes);
      expect(mockRes.statusCode).toBe(201);

      // Segunda chamada deve funcionar independentemente
      mockRes.statusCode = null;
      await CreateAlunoController.handle(mockReq, mockRes);
      expect(mockRes.statusCode).toBe(201);

      IsAlunoEmailExistsService.handle = originalIsEmailExists;
      CreateAlunoService.handle = originalCreateAluno;
    });
  });

  describe('Integração com AbstractController', () => {
    test('deve implementar método execute() abstrato', () => {
      expect(controller.execute).toBeDefined();
      expect(controller.execute).not.toBe(AbstractController.prototype.execute);
    });

    test('deve ter acesso ao método handleError da classe pai', () => {
      expect(controller.handleError).toBeDefined();
      expect(typeof controller.handleError).toBe('function');
    });

    test('deve ser uma subclasse de AbstractController', () => {
      expect(CreateAlunoController.prototype).toBeInstanceOf(Object);
      expect(Object.getPrototypeOf(CreateAlunoController.prototype)).toBe(
        AbstractController.prototype
      );
    });
  });

  describe('Cenários específicos do Aluno', () => {
    test('deve trabalhar com todos os campos específicos do aluno', () => {
      const alunoCompleto = {
        nome: 'Maria',
        sobrenome: 'Oliveira',
        email: 'maria@escola.com',
        telefone: '11987654321',
        endereco: 'Av. Principal, 456, Apt 101',
        dataNascimento: '1995-05-15',
        observacoes: 'Aluna muito dedicada, interesse especial em matemática'
      };

      const fullReq = {
        body: alunoCompleto,
        t: mockReq.t
      };

      const fullController = new CreateAlunoController(fullReq, mockRes);

      expect(fullController.req.body.endereco).toBe('Av. Principal, 456, Apt 101');
      expect(fullController.req.body.dataNascimento).toBe('1995-05-15');
      expect(fullController.req.body.observacoes).toBe(
        'Aluna muito dedicada, interesse especial em matemática'
      );
    });

    test('deve trabalhar sem campos opcionais específicos do aluno', () => {
      const alunoMinimo = {
        nome: 'Pedro',
        sobrenome: 'Costa',
        email: 'pedro@escola.com',
        telefone: '11876543210'
      };

      const minimalReq = {
        body: alunoMinimo,
        t: mockReq.t
      };

      const minimalController = new CreateAlunoController(minimalReq, mockRes);

      expect(minimalController.req.body.endereco).toBeUndefined();
      expect(minimalController.req.body.dataNascimento).toBeUndefined();
      expect(minimalController.req.body.observacoes).toBeUndefined();
    });
  });
});
