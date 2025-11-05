import { BaseValidateEntity } from '../../../src/utilities/baseValidateEntity.js';

describe('BaseValidateEntity', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      body: {
        nome: 'João',
        email: 'joao@teste.com',
        telefone: '11999999999'
      },
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

  const callNext = () => mockNext.call();

  describe('Instanciação e herança', () => {
    test('não deve permitir instanciação direta', () => {
      expect(() => {
        const instance = new BaseValidateEntity(mockReq, mockRes, callNext);
        return instance;
      }).toThrow('Método getDataForFilter() deve ser implementado na subclasse');
    });

    test('deve ser uma classe', () => {
      expect(typeof BaseValidateEntity).toBe('function');
      expect(BaseValidateEntity.prototype.constructor).toBe(BaseValidateEntity);
    });

    test('deve ter os métodos abstratos definidos', () => {
      const instance = Object.create(BaseValidateEntity.prototype);

      expect(() => instance.getDataForFilter()).toThrow(
        'Método getDataForFilter() deve ser implementado na subclasse'
      );
      expect(() => instance.getDataValidations()).toThrow(
        'Método getDataValidations() deve ser implementado na subclasse'
      );
    });
  });

  describe('Implementação correta da subclasse', () => {
    class TestValidateEntity extends BaseValidateEntity {
      getDataForFilter() {
        return ['nome', 'email', 'telefone'];
      }

      getDataValidations() {
        return {
          nome: { isValid: true, errors: [] },
          email: { isValid: true, errors: [] },
          telefone: { isValid: true, errors: [] }
        };
      }
    }

    test('deve permitir herança correta', () => {
      const validator = new TestValidateEntity(mockReq, mockRes, callNext);

      expect(validator).toBeInstanceOf(BaseValidateEntity);
      expect(validator).toBeInstanceOf(TestValidateEntity);
    });

    test('deve inicializar propriedades corretamente', () => {
      const validator = new TestValidateEntity(mockReq, mockRes, callNext);

      expect(validator.req).toBe(mockReq);
      expect(validator.res).toBe(mockRes);
      expect(validator.next).toBe(callNext);
      expect(validator.dataForFilter).toEqual(['nome', 'email', 'telefone']);
    });

    test('deve ter método handle', () => {
      const validator = new TestValidateEntity(mockReq, mockRes, callNext);

      expect(typeof validator.handle).toBe('function');
    });
  });

  describe('Validação de req.body', () => {
    class TestValidateEntity extends BaseValidateEntity {
      getDataForFilter() {
        return ['João', 'joao@teste.com'];
      }

      getDataValidations() {
        return {
          nome: { isValid: true, errors: [] },
          email: { isValid: true, errors: [] }
        };
      }
    }

    test('deve retornar erro 400 quando req.body não existe', () => {
      delete mockReq.body;
      const validator = new TestValidateEntity(mockReq, mockRes, callNext);

      validator.handle();

      expect(mockRes.statusCode).toBe(400);
      expect(mockRes.data).toEqual({
        message: 'Nenhum dado fornecido'
      });
      expect(mockNext.called).toBe(false);
    });

    test('deve retornar erro 400 quando req.body é null', () => {
      mockReq.body = null;
      const validator = new TestValidateEntity(mockReq, mockRes, callNext);

      validator.handle();

      expect(mockRes.statusCode).toBe(400);
      expect(mockRes.data).toEqual({
        message: 'Nenhum dado fornecido'
      });
      expect(mockNext.called).toBe(false);
    });

    test('deve prosseguir quando req.body é um objeto válido', () => {
      const validator = new TestValidateEntity(mockReq, mockRes, callNext);

      validator.handle();

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });
  });

  describe('Filtro de dados', () => {
    class TestValidateEntityWithFilter extends BaseValidateEntity {
      getDataForFilter() {
        return ['nome', 'email'];
      }

      getDataValidations() {
        return {
          nome: { isValid: true, errors: [] },
          email: { isValid: true, errors: [] }
        };
      }
    }

    test('deve filtrar dados corretamente baseado no dataForFilter', () => {
      mockReq.body = {
        nome: 'João',
        email: 'joao@teste.com',
        telefone: '11999999999'
      };

      class TestValidator extends BaseValidateEntity {
        getDataForFilter() {
          return ['nome', 'email'];
        }
        getDataValidations() {
          return {
            nome: { isValid: true, errors: [] },
            email: { isValid: true, errors: [] }
          };
        }
      }

      const validator = new TestValidator(mockReq, mockRes, () => mockNext.call());
      validator.handle();

      expect(mockNext.called).toBe(true);
      expect(mockReq.validatedData).toEqual({
        nome: 'João',
        email: 'joao@teste.com'
      });
    });

    test('deve filtrar apenas valores que estão no dataForFilter', () => {
      mockReq.body = {
        nome: 'João',
        email: 'joao@teste.com',
        telefone: '11999999999',
        outro: 'valor não permitido'
      };

      const validator = new TestValidateEntityWithFilter(mockReq, mockRes, callNext);

      validator.handle();

      expect(mockNext.called).toBe(true);
      expect(mockReq.validatedData).toEqual({
        nome: 'João',
        email: 'joao@teste.com'
      });
      expect(mockReq.validatedData.telefone).toBeUndefined();
      expect(mockReq.validatedData.outros).toBeUndefined();
    });

    test('deve retornar objeto vazio quando nenhum valor corresponde ao filtro', () => {
      const validator = new TestValidateEntityWithFilter(mockReq, mockRes, callNext);
      validator.dataForFilter = ['valor1', 'valor2']; // valores que não existem no req.body

      validator.handle();

      expect(mockNext.called).toBe(true);
      expect(mockReq.validatedData).toEqual({});
    });
  });

  describe('Validação de dados', () => {
    class TestValidateEntityWithErrors extends BaseValidateEntity {
      constructor(req, res, next, hasErrors = false) {
        super(req, res, next);
        this.hasErrors = hasErrors;
      }

      getDataForFilter() {
        return ['João', 'joao@teste.com'];
      }

      getDataValidations() {
        if (this.hasErrors) {
          return {
            nome: {
              isValid: false,
              errors: [
                { field: 'nome', message: 'Nome muito curto' },
                { field: 'nome', message: 'Nome contém caracteres inválidos' }
              ]
            },
            email: {
              isValid: false,
              errors: [{ field: 'email', message: 'Email inválido' }]
            }
          };
        }

        return {
          nome: { isValid: true, errors: [] },
          email: { isValid: true, errors: [] }
        };
      }
    }

    test('deve prosseguir quando todas as validações passam', () => {
      const validator = new TestValidateEntityWithErrors(mockReq, mockRes, callNext, false);

      validator.handle();

      expect(mockNext.called).toBe(true);
      expect(mockRes.statusCode).toBeNull();
    });

    test('deve retornar erro 422 quando há erros de validação', () => {
      const validator = new TestValidateEntityWithErrors(mockReq, mockRes, callNext, true);

      validator.handle();

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.message).toBe('Erro de validação');
      expect(mockRes.data.errors).toBeDefined();
      expect(mockNext.called).toBe(false);
    });

    test('deve compilar todos os erros de validação em um array', () => {
      const validator = new TestValidateEntityWithErrors(mockReq, mockRes, callNext, true);

      validator.handle();

      expect(mockRes.statusCode).toBe(422);
      expect(Array.isArray(mockRes.data.errors)).toBe(true);
      expect(mockRes.data.errors.length).toBe(3);
      expect(mockRes.data.errors).toContainEqual({ field: 'nome', message: 'Nome muito curto' });
      expect(mockRes.data.errors).toContainEqual({
        field: 'nome',
        message: 'Nome contém caracteres inválidos'
      });
      expect(mockRes.data.errors).toContainEqual({ field: 'email', message: 'Email inválido' });
    });

    test('deve ignorar validações que passaram e incluir apenas erros', () => {
      class MixedValidateEntity extends BaseValidateEntity {
        getDataForFilter() {
          return ['João', 'joao@teste.com'];
        }

        getDataValidations() {
          return {
            nome: { isValid: true, errors: [] },
            email: {
              isValid: false,
              errors: [{ field: 'email', message: 'Email inválido' }]
            },
            telefone: { isValid: true, errors: [] }
          };
        }
      }

      const validator = new MixedValidateEntity(mockReq, mockRes, callNext);

      validator.handle();

      expect(mockRes.statusCode).toBe(422);
      expect(mockRes.data.errors.length).toBe(1);
      expect(mockRes.data.errors).toContainEqual({ field: 'email', message: 'Email inválido' });
    });
  });

  describe('Propriedade req.validatedData', () => {
    class TestValidateEntity extends BaseValidateEntity {
      getDataForFilter() {
        return ['nome', 'email'];
      }

      getDataValidations() {
        return {
          nome: { isValid: true, errors: [] },
          email: { isValid: true, errors: [] }
        };
      }
    }

    test('deve definir req.validatedData quando validação passa', () => {
      const validator = new TestValidateEntity(mockReq, mockRes, callNext);

      validator.handle();

      expect(mockReq.validatedData).toBeDefined();
      expect(typeof mockReq.validatedData).toBe('object');
      expect(mockReq.validatedData).toEqual({
        nome: 'João',
        email: 'joao@teste.com'
      });
    });

    test('não deve definir req.validatedData quando validação falha', () => {
      class ErrorValidateEntity extends BaseValidateEntity {
        getDataForFilter() {
          return ['João'];
        }

        getDataValidations() {
          return {
            nome: {
              isValid: false,
              errors: [{ field: 'nome', message: 'Nome inválido' }]
            }
          };
        }
      }

      const validator = new ErrorValidateEntity(mockReq, mockRes, callNext);

      validator.handle();

      expect(mockReq.validatedData).toBeUndefined();
    });

    test('deve definir req.validatedData como array vazio quando nenhum dado corresponde ao filtro', () => {
      class EmptyFilterValidateEntity extends BaseValidateEntity {
        getDataForFilter() {
          return ['valor_inexistente'];
        }

        getDataValidations() {
          return {};
        }
      }

      const validator = new EmptyFilterValidateEntity(mockReq, mockRes, callNext);

      validator.handle();

      expect(mockReq.validatedData).toEqual({});
    });
  });

  describe('Tratamento de erros', () => {
    class ErrorThrowingValidateEntity extends BaseValidateEntity {
      getDataForFilter() {
        return ['João'];
      }

      getDataValidations() {
        throw new Error('Erro interno na validação');
      }
    }

    test('deve tratar erro interno e retornar 500', () => {
      const validator = new ErrorThrowingValidateEntity(mockReq, mockRes, callNext);

      validator.handle();

      expect(mockRes.statusCode).toBe(500);
      expect(mockRes.data.message).toBe('Erro interno do servidor');
      expect(mockRes.data.error).toBe('Erro interno na validação');
      expect(mockNext.called).toBe(false);
    });

    test('deve usar tradução quando req.t existe para erro interno', () => {
      const validator = new ErrorThrowingValidateEntity(mockReq, mockRes, callNext);

      validator.handle();

      expect(mockRes.statusCode).toBe(500);
      expect(mockRes.data.message).toBe('Erro interno do servidor');
    });

    test('deve funcionar quando req.t não existe para erro interno', () => {
      delete mockReq.t;
      const validator = new ErrorThrowingValidateEntity(mockReq, mockRes, callNext);

      validator.handle();

      expect(mockRes.statusCode).toBe(500);
      expect(mockRes.data.message).toBe('Erro interno do servidor');
      expect(mockRes.data.error).toBe('Erro interno na validação');
    });
  });

  describe('Casos extremos e edge cases', () => {
    class TestValidateEntity extends BaseValidateEntity {
      getDataForFilter() {
        return ['nome', 'email', 'telefone'];
      }

      getDataValidations() {
        return {
          nome: { isValid: true, errors: [] },
          email: { isValid: true, errors: [] },
          telefone: { isValid: true, errors: [] }
        };
      }
    }

    test('deve lidar com valores null no req.body', () => {
      mockReq.body = {
        nome: 'João',
        email: null,
        telefone: undefined
      };

      const validator = new TestValidateEntity(mockReq, mockRes, callNext);

      validator.handle();

      expect(mockNext.called).toBe(true);
      expect(mockReq.validatedData.nome).toBe('João');
      expect(mockReq.validatedData.email).toBe(null);
      expect(mockReq.validatedData.telefone).toBe(undefined);
    });

    test('deve lidar com req.body vazio', () => {
      mockReq.body = {};

      const validator = new TestValidateEntity(mockReq, mockRes, callNext);

      validator.handle();

      expect(mockNext.called).toBe(true);
      expect(mockReq.validatedData).toEqual({});
    });

    test('deve lidar com dataForFilter vazio', () => {
      class EmptyFilterEntity extends BaseValidateEntity {
        getDataForFilter() {
          return [];
        }

        getDataValidations() {
          return {};
        }
      }

      const validator = new EmptyFilterEntity(mockReq, mockRes, callNext);

      validator.handle();

      expect(mockNext.called).toBe(true);
      expect(mockReq.validatedData).toEqual({});
    });

    test('deve lidar com validações vazias', () => {
      class EmptyValidationsEntity extends BaseValidateEntity {
        getDataForFilter() {
          return ['nome'];
        }

        getDataValidations() {
          return {};
        }
      }

      const validator = new EmptyValidationsEntity(mockReq, mockRes, callNext);

      validator.handle();

      expect(mockNext.called).toBe(true);
      expect(mockReq.validatedData).toEqual({ nome: 'João' });
    });
  });

  describe('Funcionalidades específicas do método handle', () => {
    class TestValidateEntity extends BaseValidateEntity {
      getDataForFilter() {
        return ['João', 'joao@teste.com'];
      }

      getDataValidations() {
        return {
          nome: { isValid: true, errors: [] },
          email: { isValid: true, errors: [] }
        };
      }
    }

    test('deve retornar valor do res.status() para permitir encadeamento', () => {
      delete mockReq.body;
      const validator = new TestValidateEntity(mockReq, mockRes, callNext);

      const result = validator.handle();

      // O handle deve retornar o resultado do res.status().json()
      expect(result).toBe(mockRes);
    });

    test('deve retornar valor do next() quando validação passa', () => {
      const validator = new TestValidateEntity(mockReq, mockRes, callNext);

      const result = validator.handle();

      expect(result).toBeUndefined(); // next() não retorna valor
      expect(mockNext.called).toBe(true);
    });

    test('deve processar corretamente múltiplos campos', () => {
      mockReq.body = {
        campo1: 'valor',
        campo2: 'valor',
        campo3: 'outro_valor'
      };

      class DuplicateValueEntity extends BaseValidateEntity {
        getDataForFilter() {
          return ['campo1', 'campo3'];
        }

        getDataValidations() {
          return {
            campo1: { isValid: true, errors: [] },
            campo3: { isValid: true, errors: [] }
          };
        }
      }

      const validator = new DuplicateValueEntity(mockReq, mockRes, callNext);

      validator.handle();

      expect(mockNext.called).toBe(true);
      expect(mockReq.validatedData).toEqual({
        campo1: 'valor',
        campo3: 'outro_valor'
      });
    });
  });
});
