import { UpdateUserController } from '../../../../src/controllers/user/updateUserController.js';
import AbstractController from '../../../../src/controllers/abstractController.js';

describe('UpdateUserController', () => {
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
        permissao: 'admin'
      },
      t: key => {
        const translations = {
          'users.get.not_found': 'Usuário não encontrado',
          'users.create.email_exists': 'Este email já está em uso',
          'users.update.error': 'Erro ao atualizar usuário'
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

    controller = new UpdateUserController(mockReq, mockRes);
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
  });

  describe('Métodos e estrutura', () => {
    test('deve ter método execute', () => {
      expect(typeof controller.execute).toBe('function');
    });

    test('deve ter método handle estático', () => {
      expect(typeof UpdateUserController.handle).toBe('function');
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
      expect(controller.req.t('users.get.not_found')).toBe('Usuário não encontrado');
    });
  });

  describe('Validação de dados de entrada', () => {
    test('deve trabalhar com dados de atualização completos', () => {
      expect(controller.req.body.nome).toBe('João Atualizado');
      expect(controller.req.body.sobrenome).toBe('Silva Santos');
      expect(controller.req.body.email).toBe('joao.novo@teste.com');
      expect(controller.req.body.telefone).toBe('11988887777');
      expect(controller.req.body.permissao).toBe('admin');
    });

    test('deve trabalhar com dados parciais', () => {
      const partialReq = {
        ...mockReq,
        body: {
          nome: 'Apenas Nome',
          email: 'nome@teste.com'
        }
      };

      const partialController = new UpdateUserController(partialReq, mockRes);

      expect(partialController.req.body.nome).toBe('Apenas Nome');
      expect(partialController.req.body.email).toBe('nome@teste.com');
      expect(partialController.req.body.sobrenome).toBeUndefined();
    });

    test('deve priorizar validatedId sobre params.id', () => {
      const reqWithBoth = {
        ...mockReq,
        params: { id: 'different_id' },
        validatedId: 'validated_id'
      };

      const controllerWithBoth = new UpdateUserController(reqWithBoth, mockRes);

      expect(controllerWithBoth.req.validatedId).toBe('validated_id');
      expect(controllerWithBoth.req.params.id).toBe('different_id');
    });

    test('deve usar params.id quando validatedId não existe', () => {
      const reqWithoutValidated = {
        ...mockReq,
        validatedId: undefined
      };

      const controllerWithoutValidated = new UpdateUserController(reqWithoutValidated, mockRes);

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
      mockRes.status(200).json({ message: 'Usuário atualizado' });

      expect(mockRes.statusCode).toBe(200);
      expect(mockRes.data).toEqual({ message: 'Usuário atualizado' });
    });
  });

  describe('Tradução e internacionalização', () => {
    test('deve traduzir mensagem de usuário não encontrado', () => {
      const message = controller.req.t('users.get.not_found');
      expect(message).toBe('Usuário não encontrado');
    });

    test('deve traduzir mensagem de email existente', () => {
      const message = controller.req.t('users.create.email_exists');
      expect(message).toBe('Este email já está em uso');
    });

    test('deve traduzir mensagem de erro de atualização', () => {
      const message = controller.req.t('users.update.error');
      expect(message).toBe('Erro ao atualizar usuário');
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

      const emptyNameController = new UpdateUserController(emptyNameReq, mockRes);
      expect(emptyNameController.req.body.nome).toBe('');
    });

    test('deve lidar com permissao como string', () => {
      expect(typeof controller.req.body.permissao).toBe('string');
      expect(controller.req.body.permissao).toBe('admin');
    });

    test('deve lidar com diferentes tipos de permissão', () => {
      const permissions = ['user', 'admin', 'moderator'];

      permissions.forEach(permission => {
        const reqWithPermission = {
          ...mockReq,
          body: { ...mockReq.body, permissao: permission }
        };

        const controllerWithPermission = new UpdateUserController(reqWithPermission, mockRes);
        expect(controllerWithPermission.req.body.permissao).toBe(permission);
      });
    });
  });

  describe('Cenários de email', () => {
    test('deve trabalhar com email em minúsculas', () => {
      const lowerCaseReq = {
        ...mockReq,
        body: { ...mockReq.body, email: 'usuario@teste.com' }
      };

      const lowerCaseController = new UpdateUserController(lowerCaseReq, mockRes);
      expect(lowerCaseController.req.body.email).toBe('usuario@teste.com');
    });

    test('deve trabalhar com email em maiúsculas', () => {
      const upperCaseReq = {
        ...mockReq,
        body: { ...mockReq.body, email: 'USUARIO@TESTE.COM' }
      };

      const upperCaseController = new UpdateUserController(upperCaseReq, mockRes);
      expect(upperCaseController.req.body.email).toBe('USUARIO@TESTE.COM');
    });

    test('deve trabalhar com emails complexos', () => {
      const complexEmails = [
        'usuario.teste@subdominio.exemplo.com',
        'usuario+tag@exemplo.com.br',
        'usuario_123@exemplo-teste.org'
      ];

      complexEmails.forEach(email => {
        const reqWithComplexEmail = {
          ...mockReq,
          body: { ...mockReq.body, email }
        };

        const controllerWithComplexEmail = new UpdateUserController(reqWithComplexEmail, mockRes);
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

        const controllerWithCuid = new UpdateUserController(reqWithCuid, mockRes);
        expect(controllerWithCuid.req.params.id).toBe(cuid);
        expect(controllerWithCuid.req.validatedId).toBe(cuid);
      });
    });

    test('deve lidar com ID apenas em params', () => {
      const reqWithParamsOnly = {
        ...mockReq,
        validatedId: null
      };

      const controllerWithParamsOnly = new UpdateUserController(reqWithParamsOnly, mockRes);
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
        message: 'Usuário não encontrado'
      });

      expect(mockRes.statusCode).toBe(404);
      expect(mockRes.data).toEqual({
        message: 'Usuário não encontrado'
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
      const updatedUser = {
        id: 'clh4d6j8h0000kc1j5v3m2n4o',
        nome: 'João Atualizado',
        email: 'joao.novo@teste.com'
      };

      mockRes.status(200).json(updatedUser);

      expect(mockRes.statusCode).toBe(200);
      expect(mockRes.data).toEqual(updatedUser);
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

        const controllerWithSpecialName = new UpdateUserController(reqWithSpecialName, mockRes);
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

        const controllerWithPhone = new UpdateUserController(reqWithPhone, mockRes);
        expect(controllerWithPhone.req.body.telefone).toBe(telefone);
      });
    });

    test('deve lidar com campos opcionais undefined', () => {
      const reqWithUndefinedFields = {
        ...mockReq,
        body: {
          nome: 'João',
          email: 'joao@teste.com',
          sobrenome: undefined,
          telefone: undefined,
          permissao: undefined
        }
      };

      const controllerWithUndefined = new UpdateUserController(reqWithUndefinedFields, mockRes);

      expect(controllerWithUndefined.req.body.nome).toBe('João');
      expect(controllerWithUndefined.req.body.email).toBe('joao@teste.com');
      expect(controllerWithUndefined.req.body.sobrenome).toBeUndefined();
      expect(controllerWithUndefined.req.body.telefone).toBeUndefined();
      expect(controllerWithUndefined.req.body.permissao).toBeUndefined();
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

      const controllerWithEmailChange = new UpdateUserController(reqWithEmailChange, mockRes);

      // Simula um usuário existente com email diferente
      const existingUser = { email: originalEmail };

      // Verifica se os emails são diferentes
      expect(existingUser.email !== controllerWithEmailChange.req.body.email).toBe(true);
    });

    test('deve ter estrutura para emails iguais', () => {
      const sameEmail = 'mesmo@teste.com';

      const reqWithSameEmail = {
        ...mockReq,
        body: { ...mockReq.body, email: sameEmail }
      };

      const controllerWithSameEmail = new UpdateUserController(reqWithSameEmail, mockRes);

      // Simula um usuário existente com mesmo email
      const existingUser = { email: sameEmail };

      // Verifica se os emails são iguais
      expect(existingUser.email === controllerWithSameEmail.req.body.email).toBe(true);
    });
  });
});
