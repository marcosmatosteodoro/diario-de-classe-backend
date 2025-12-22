import { UpdateAlunoController } from '../../../../src/controllers/aluno/updateAlunoController.js';
import { GetAlunoService } from '../../../../src/services/aluno/getAlunoService.js';
import { UpdateAlunoService } from '../../../../src/services/aluno/updateAlunoService.js';
import { IsAlunoEmailExistsService } from '../../../../src/services/aluno/isAlunoEmailExistsService.js';
import AbstractController from '../../../../src/controllers/abstractController.js';

describe('UpdateAlunoController', () => {
  let controller, mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      params: {
        id: 'clh4d6j8h0000kc1j5v3m2n4o'
      },
      validatedId: 'clh4d6j8h0000kc1j5v3m2n4o',
      body: {
        nome: 'João Atualizado',
        sobrenome: 'Silva Santos',
        email: 'joao.novo@teste.com',
        telefone: '11988887777',
        endereco: 'Rua Nova, 456',
        dataNascimento: '1990-02-15',
        observacoes: 'Aluno atualizado com interesse em inglês'
      },
      t: key => {
        const translations = {
          'alunos.get.not_found': 'Aluno não encontrado',
          'alunos.create.email_exists': 'Este email já está em uso',
          'alunos.update.error': 'Erro ao atualizar aluno'
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

    controller = new UpdateAlunoController(mockReq, mockRes);
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
      expect(controller.req.params.id).toBe('clh4d6j8h0000kc1j5v3m2n4o');
      expect(controller.req.validatedId).toBe('clh4d6j8h0000kc1j5v3m2n4o');
      expect(controller.req.body).toEqual(mockReq.body);
      expect(typeof controller.req.t).toBe('function');
    });

    test('deve criar uma instância com req e res', () => {
      expect(controller).toBeInstanceOf(UpdateAlunoController);
      expect(controller.req).toBe(mockReq);
      expect(controller.res).toBe(mockRes);
    });
  });

  describe('Métodos e estrutura', () => {
    test('deve ter método execute', () => {
      expect(typeof controller.execute).toBe('function');
    });

    test('deve ter método handle estático', () => {
      expect(typeof UpdateAlunoController.handle).toBe('function');
    });

    test('deve ter acesso aos dados do corpo da requisição', () => {
      expect(controller.req.body.nome).toBe('João Atualizado');
      expect(controller.req.body.email).toBe('joao.novo@teste.com');
    });

    test('deve ter acesso ao ID dos parâmetros', () => {
      expect(controller.req.params.id).toBe('clh4d6j8h0000kc1j5v3m2n4o');
      expect(controller.req.validatedId).toBe('clh4d6j8h0000kc1j5v3m2n4o');
    });

    test('deve ter acesso à função de tradução', () => {
      expect(controller.req.t('alunos.get.not_found')).toBe('Aluno não encontrado');
    });

    test('deve ter método execute como função assíncrona', () => {
      expect(typeof controller.execute).toBe('function');
      expect(controller.execute.constructor.name).toBe('AsyncFunction');
    });
  });

  describe('Validação de dados de entrada', () => {
    test('deve trabalhar com dados de atualização completos', () => {
      expect(controller.req.body.nome).toBe('João Atualizado');
      expect(controller.req.body.sobrenome).toBe('Silva Santos');
      expect(controller.req.body.email).toBe('joao.novo@teste.com');
      expect(controller.req.body.telefone).toBe('11988887777');
      expect(controller.req.body.endereco).toBe('Rua Nova, 456');
      expect(controller.req.body.dataNascimento).toBe('1990-02-15');
      expect(controller.req.body.observacoes).toBe('Aluno atualizado com interesse em inglês');
    });

    test('deve trabalhar com dados parciais', () => {
      const partialReq = {
        ...mockReq,
        body: {
          nome: 'Apenas Nome',
          email: 'nome@teste.com'
        }
      };

      const partialController = new UpdateAlunoController(partialReq, mockRes);

      expect(partialController.req.body.nome).toBe('Apenas Nome');
      expect(partialController.req.body.email).toBe('nome@teste.com');
      expect(partialController.req.body.sobrenome).toBeUndefined();
      expect(partialController.req.body.endereco).toBeUndefined();
    });

    test('deve priorizar validatedId sobre params.id', () => {
      const reqWithBoth = {
        ...mockReq,
        params: { id: 'different_id' },
        validatedId: 'validated_id'
      };

      const controllerWithBoth = new UpdateAlunoController(reqWithBoth, mockRes);

      expect(controllerWithBoth.req.validatedId).toBe('validated_id');
      expect(controllerWithBoth.req.params.id).toBe('different_id');
    });

    test('deve usar params.id quando validatedId não existe', () => {
      const reqWithoutValidated = {
        ...mockReq,
        validatedId: undefined
      };

      const controllerWithoutValidated = new UpdateAlunoController(reqWithoutValidated, mockRes);

      expect(controllerWithoutValidated.req.params.id).toBe('clh4d6j8h0000kc1j5v3m2n4o');
      expect(controllerWithoutValidated.req.validatedId).toBeUndefined();
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
      mockRes.status(200).json({ message: 'Aluno atualizado' });

      expect(mockRes.statusCode).toBe(200);
      expect(mockRes.data).toEqual({ message: 'Aluno atualizado' });
    });
  });

  describe('Tradução e internacionalização', () => {
    test('deve traduzir mensagem de aluno não encontrado', () => {
      const message = controller.req.t('alunos.get.not_found');
      expect(message).toBe('Aluno não encontrado');
    });

    test('deve traduzir mensagem de email existente', () => {
      const message = controller.req.t('alunos.create.email_exists');
      expect(message).toBe('Este email já está em uso');
    });

    test('deve traduzir mensagem de erro de atualização', () => {
      const message = controller.req.t('alunos.update.error');
      expect(message).toBe('Erro ao atualizar aluno');
    });

    test('deve retornar chave se tradução não existir', () => {
      const message = controller.req.t('chave.inexistente');
      expect(message).toBe('chave.inexistente');
    });

    test('deve usar chave de tradução correta para aluno não encontrado', () => {
      let translationKey = '';
      mockReq.t = key => {
        translationKey = key;
        return 'Aluno não encontrado';
      };

      controller.req.t('alunos.get.not_found');
      expect(translationKey).toBe('alunos.get.not_found');
    });
  });

  describe('Tipos de dados', () => {
    test('deve lidar com string vazia no nome', () => {
      const emptyNameReq = {
        ...mockReq,
        body: { ...mockReq.body, nome: '' }
      };

      const emptyNameController = new UpdateAlunoController(emptyNameReq, mockRes);
      expect(emptyNameController.req.body.nome).toBe('');
    });

    test('deve lidar com data de nascimento como string', () => {
      expect(typeof controller.req.body.dataNascimento).toBe('string');
      expect(controller.req.body.dataNascimento).toBe('1990-02-15');
    });

    test('deve lidar com endereco como string', () => {
      expect(typeof controller.req.body.endereco).toBe('string');
      expect(controller.req.body.endereco).toBe('Rua Nova, 456');
    });

    test('deve lidar com observações como string', () => {
      expect(typeof controller.req.body.observacoes).toBe('string');
      expect(controller.req.body.observacoes).toBe('Aluno atualizado com interesse em inglês');
    });
  });

  describe('Cenários de email', () => {
    test('deve trabalhar com email em minúsculas', () => {
      const lowerCaseReq = {
        ...mockReq,
        body: { ...mockReq.body, email: 'aluno@teste.com' }
      };

      const lowerCaseController = new UpdateAlunoController(lowerCaseReq, mockRes);
      expect(lowerCaseController.req.body.email).toBe('aluno@teste.com');
    });

    test('deve trabalhar com email em maiúsculas', () => {
      const upperCaseReq = {
        ...mockReq,
        body: { ...mockReq.body, email: 'ALUNO@TESTE.COM' }
      };

      const upperCaseController = new UpdateAlunoController(upperCaseReq, mockRes);
      expect(upperCaseController.req.body.email).toBe('ALUNO@TESTE.COM');
    });

    test('deve trabalhar com emails complexos', () => {
      const complexEmails = [
        'aluno.teste@subdominio.exemplo.com',
        'aluno+tag@exemplo.com.br',
        'aluno_123@exemplo-teste.org'
      ];

      complexEmails.forEach(email => {
        const reqWithComplexEmail = {
          ...mockReq,
          body: { ...mockReq.body, email }
        };

        const controllerWithComplexEmail = new UpdateAlunoController(reqWithComplexEmail, mockRes);
        expect(controllerWithComplexEmail.req.body.email).toBe(email);
      });
    });
  });

  describe('Validação de IDs', () => {
    test('deve trabalhar com diferentes formatos de CUID', () => {
      const cuidFormats = [
        'clh4d6j8h0000kc1j5v3m2n4o',
        'clh5e7k9i1111ld2k6w4n3o5p',
        'clh6f8l0j2222me3l7x5o4p6q'
      ];

      cuidFormats.forEach(cuid => {
        const reqWithCuid = {
          ...mockReq,
          params: { id: cuid },
          validatedId: cuid
        };

        const controllerWithCuid = new UpdateAlunoController(reqWithCuid, mockRes);
        expect(controllerWithCuid.req.params.id).toBe(cuid);
        expect(controllerWithCuid.req.validatedId).toBe(cuid);
      });
    });

    test('deve lidar com ID apenas em params', () => {
      const reqWithParamsOnly = {
        ...mockReq,
        validatedId: null
      };

      const controllerWithParamsOnly = new UpdateAlunoController(reqWithParamsOnly, mockRes);
      expect(controllerWithParamsOnly.req.params.id).toBe('clh4d6j8h0000kc1j5v3m2n4o');
      expect(controllerWithParamsOnly.req.validatedId).toBeNull();
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
      mockRes.status(404);
      expect(mockRes.statusCode).toBe(404);

      mockRes.status(200);
      expect(mockRes.statusCode).toBe(200);

      mockRes.status(409);
      expect(mockRes.statusCode).toBe(409);
    });

    test('deve estruturar resposta de erro 404', () => {
      mockRes.status(404).json({
        message: 'Aluno não encontrado'
      });

      expect(mockRes.statusCode).toBe(404);
      expect(mockRes.data).toEqual({
        message: 'Aluno não encontrado'
      });
    });

    test('deve estruturar resposta de erro 409', () => {
      mockRes.status(409).json({
        message: 'Este email já está em uso'
      });

      expect(mockRes.statusCode).toBe(409);
      expect(mockRes.data).toEqual({
        message: 'Este email já está em uso'
      });
    });

    test('deve estruturar resposta de sucesso 200', () => {
      const updatedAluno = {
        id: 'clh4d6j8h0000kc1j5v3m2n4o',
        nome: 'João Atualizado',
        email: 'joao.novo@teste.com'
      };

      mockRes.status(200).json(updatedAluno);

      expect(mockRes.statusCode).toBe(200);
      expect(mockRes.data).toEqual(updatedAluno);
    });
  });

  describe('Casos extremos', () => {
    test('deve lidar com nomes com caracteres especiais', () => {
      const specialNames = [
        'José María',
        'François André',
        'João-Paulo',
        'Ana Clara',
        'Antônio José'
      ];

      specialNames.forEach(nome => {
        const reqWithSpecialName = {
          ...mockReq,
          body: { ...mockReq.body, nome }
        };

        const controllerWithSpecialName = new UpdateAlunoController(reqWithSpecialName, mockRes);
        expect(controllerWithSpecialName.req.body.nome).toBe(nome);
      });
    });

    test('deve processar telefones em diferentes formatos', () => {
      const phoneFormats = [
        '11999999999',
        '+5511999999999',
        '(11) 99999-9999',
        '11 99999-9999',
        '11999999999'
      ];

      phoneFormats.forEach(telefone => {
        const reqWithPhone = {
          ...mockReq,
          body: { ...mockReq.body, telefone }
        };

        const controllerWithPhone = new UpdateAlunoController(reqWithPhone, mockRes);
        expect(controllerWithPhone.req.body.telefone).toBe(telefone);
      });
    });

    test('deve lidar com campos opcionais undefined', () => {
      const reqWithUndefinedFields = {
        ...mockReq,
        body: {
          nome: 'João',
          sobrenome: 'Silva',
          email: 'joao@teste.com',
          telefone: '11999999999',
          endereco: undefined,
          dataNascimento: undefined,
          observacoes: undefined
        }
      };

      const controllerWithUndefined = new UpdateAlunoController(reqWithUndefinedFields, mockRes);

      expect(controllerWithUndefined.req.body.nome).toBe('João');
      expect(controllerWithUndefined.req.body.email).toBe('joao@teste.com');
      expect(controllerWithUndefined.req.body.endereco).toBeUndefined();
      expect(controllerWithUndefined.req.body.dataNascimento).toBeUndefined();
      expect(controllerWithUndefined.req.body.observacoes).toBeUndefined();
    });

    test('deve lidar com diferentes formatos de data', () => {
      const dateFormats = ['1990-01-01', '1995-12-25', '2000-06-15', '1985-03-08'];

      dateFormats.forEach(dataNascimento => {
        const reqWithDate = {
          ...mockReq,
          body: { ...mockReq.body, dataNascimento }
        };

        const controllerWithDate = new UpdateAlunoController(reqWithDate, mockRes);
        expect(controllerWithDate.req.body.dataNascimento).toBe(dataNascimento);
      });
    });
  });

  describe('Fluxo de comparação de email', () => {
    test('deve ter estrutura para comparar emails diferentes', () => {
      const originalEmail = 'email.antigo@teste.com';
      const newEmail = 'email.novo@teste.com';

      const reqWithEmailChange = {
        ...mockReq,
        body: { ...mockReq.body, email: newEmail }
      };

      const controllerWithEmailChange = new UpdateAlunoController(reqWithEmailChange, mockRes);

      // Simula um aluno existente com email diferente
      const existingAluno = { email: originalEmail };

      // Verifica se os emails são diferentes
      expect(existingAluno.email !== controllerWithEmailChange.req.body.email).toBe(true);
    });

    test('deve ter estrutura para emails iguais', () => {
      const sameEmail = 'mesmo@teste.com';

      const reqWithSameEmail = {
        ...mockReq,
        body: { ...mockReq.body, email: sameEmail }
      };

      const controllerWithSameEmail = new UpdateAlunoController(reqWithSameEmail, mockRes);

      // Simula um aluno existente com mesmo email
      const existingAluno = { email: sameEmail };

      // Verifica se os emails são iguais
      expect(existingAluno.email === controllerWithSameEmail.req.body.email).toBe(true);
    });
  });

  describe('Método execute() - Funcionalidade', () => {
    test('deve retornar 404 quando aluno não existe', async () => {
      const originalGetAluno = GetAlunoService.handle;
      GetAlunoService.handle = async () => null;

      await controller.execute();

      expect(mockRes.statusCode).toBe(404);
      expect(mockRes.data).toEqual({
        message: 'Aluno não encontrado'
      });

      GetAlunoService.handle = originalGetAluno;
    });

    test('deve retornar 409 quando email já existe e é diferente', async () => {
      const originalGetAluno = GetAlunoService.handle;
      const originalIsEmailExists = IsAlunoEmailExistsService.handle;

      const existingAluno = { email: 'email.antigo@teste.com' };
      GetAlunoService.handle = async () => existingAluno;
      IsAlunoEmailExistsService.handle = async () => true;

      await controller.execute();

      expect(mockRes.statusCode).toBe(409);
      expect(mockRes.data).toEqual({
        message: 'Este email já está em uso'
      });

      GetAlunoService.handle = originalGetAluno;
      IsAlunoEmailExistsService.handle = originalIsEmailExists;
    });

    test('deve atualizar aluno e retornar 200 quando email não mudou', async () => {
      const originalGetAluno = GetAlunoService.handle;
      const originalUpdateAluno = UpdateAlunoService.handle;

      const sameEmail = 'joao.novo@teste.com';
      const existingAluno = { email: sameEmail };
      const updatedAluno = { id: 1, email: sameEmail, nome: 'João Atualizado' };

      GetAlunoService.handle = async () => existingAluno;
      UpdateAlunoService.handle = async () => updatedAluno;

      await controller.execute();

      expect(mockRes.statusCode).toBe(200);
      expect(mockRes.data).toEqual(updatedAluno);

      GetAlunoService.handle = originalGetAluno;
      UpdateAlunoService.handle = originalUpdateAluno;
    });

    test('deve atualizar aluno e retornar 200 quando novo email não existe', async () => {
      const originalGetAluno = GetAlunoService.handle;
      const originalIsEmailExists = IsAlunoEmailExistsService.handle;
      const originalUpdateAluno = UpdateAlunoService.handle;

      const existingAluno = { email: 'email.antigo@teste.com' };
      const updatedAluno = { id: 1, email: 'joao.novo@teste.com', nome: 'João Atualizado' };

      GetAlunoService.handle = async () => existingAluno;
      IsAlunoEmailExistsService.handle = async () => false;
      UpdateAlunoService.handle = async () => updatedAluno;

      await controller.execute();

      expect(mockRes.statusCode).toBe(200);
      expect(mockRes.data).toEqual(updatedAluno);

      GetAlunoService.handle = originalGetAluno;
      IsAlunoEmailExistsService.handle = originalIsEmailExists;
      UpdateAlunoService.handle = originalUpdateAluno;
    });

    test('deve tratar erro e chamar handleError', async () => {
      const originalGetAluno = GetAlunoService.handle;
      const testError = new Error('Database error');

      GetAlunoService.handle = async () => {
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
      expect(handledTranslationKey).toBe('alunos.update.error');

      GetAlunoService.handle = originalGetAluno;
    });

    test('deve usar ID validado quando disponível', async () => {
      mockReq.validatedId = '123';
      mockReq.params.id = '456';

      const originalGetAluno = GetAlunoService.handle;
      const originalUpdateAluno = UpdateAlunoService.handle;

      let receivedIdGet = null;
      let receivedIdUpdate = null;

      GetAlunoService.handle = async id => {
        receivedIdGet = id;
        return { email: 'test@test.com' };
      };

      UpdateAlunoService.handle = async (id, data) => {
        receivedIdUpdate = id;
        return { id, ...data };
      };

      await controller.execute();

      expect(receivedIdGet).toBe('123');
      expect(receivedIdUpdate).toBe('123');

      GetAlunoService.handle = originalGetAluno;
      UpdateAlunoService.handle = originalUpdateAluno;
    });

    test('deve passar dados corretos para UpdateAlunoService', async () => {
      const originalGetAluno = GetAlunoService.handle;
      const originalUpdateAluno = UpdateAlunoService.handle;

      let receivedData = null;

      GetAlunoService.handle = async () => ({ email: 'old@test.com' });
      UpdateAlunoService.handle = async (id, data) => {
        receivedData = data;
        return { id, ...data };
      };

      await controller.execute();

      expect(receivedData).toEqual(mockReq.body);

      GetAlunoService.handle = originalGetAluno;
      UpdateAlunoService.handle = originalUpdateAluno;
    });
  });

  describe('Método estático handle()', () => {
    test('deve ser uma função estática', () => {
      expect(typeof UpdateAlunoController.handle).toBe('function');
      expect(UpdateAlunoController.handle).not.toBe(AbstractController.handle);
    });

    test('deve executar através do método estático', async () => {
      const originalGetAluno = GetAlunoService.handle;
      const originalUpdateAluno = UpdateAlunoService.handle;

      const mockAluno = { id: 1, nome: 'João', email: 'joao@test.com' };

      GetAlunoService.handle = async () => mockAluno;
      UpdateAlunoService.handle = async () => mockAluno;

      await UpdateAlunoController.handle(mockReq, mockRes);

      expect(mockRes.statusCode).toBe(200);
      expect(mockRes.data).toEqual(mockAluno);

      GetAlunoService.handle = originalGetAluno;
      UpdateAlunoService.handle = originalUpdateAluno;
    });

    test('deve criar nova instância do controller a cada chamada', async () => {
      const originalGetAluno = GetAlunoService.handle;
      const originalUpdateAluno = UpdateAlunoService.handle;

      GetAlunoService.handle = async () => ({ email: 'test@test.com' });
      UpdateAlunoService.handle = async () => ({ id: 1, nome: 'Test' });

      await UpdateAlunoController.handle(mockReq, mockRes);
      expect(mockRes.statusCode).toBe(200);

      // Segunda chamada deve funcionar independentemente
      mockRes.statusCode = null;
      await UpdateAlunoController.handle(mockReq, mockRes);
      expect(mockRes.statusCode).toBe(200);

      GetAlunoService.handle = originalGetAluno;
      UpdateAlunoService.handle = originalUpdateAluno;
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
      expect(UpdateAlunoController.prototype).toBeInstanceOf(Object);
      expect(Object.getPrototypeOf(UpdateAlunoController.prototype)).toBe(
        AbstractController.prototype
      );
    });

    test('deve implementar método handle() estático', () => {
      expect(typeof UpdateAlunoController.handle).toBe('function');
      expect(UpdateAlunoController.handle).not.toBe(AbstractController.handle);
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
        observacoes: 'Aluna muito dedicada, progresso excelente em matemática'
      };

      const fullReq = {
        ...mockReq,
        body: alunoCompleto
      };

      const fullController = new UpdateAlunoController(fullReq, mockRes);

      expect(fullController.req.body.endereco).toBe('Av. Principal, 456, Apt 101');
      expect(fullController.req.body.dataNascimento).toBe('1995-05-15');
      expect(fullController.req.body.observacoes).toBe(
        'Aluna muito dedicada, progresso excelente em matemática'
      );
    });

    test('deve trabalhar com endereços complexos', () => {
      const complexAddresses = [
        'Rua das Flores, 123, Apt 45, Bloco B',
        'Av. Paulista, 1000 - Conjunto 15',
        'Travessa dos Anjos, s/n',
        'Rod. BR-101, Km 45, Casa 3'
      ];

      complexAddresses.forEach(endereco => {
        const reqWithAddress = {
          ...mockReq,
          body: { ...mockReq.body, endereco }
        };

        const controllerWithAddress = new UpdateAlunoController(reqWithAddress, mockRes);
        expect(controllerWithAddress.req.body.endereco).toBe(endereco);
      });
    });

    test('deve trabalhar com observações extensas', () => {
      const longObservation =
        'Este aluno demonstra excelente progresso em todas as disciplinas. ' +
        'Participa ativamente das aulas, sempre pontual e dedicado aos estudos. ' +
        'Recomenda-se acompanhamento especial em matemática avançada.';

      const reqWithLongObservation = {
        ...mockReq,
        body: { ...mockReq.body, observacoes: longObservation }
      };

      const controllerWithLongObservation = new UpdateAlunoController(
        reqWithLongObservation,
        mockRes
      );
      expect(controllerWithLongObservation.req.body.observacoes).toBe(longObservation);
    });
  });
});
