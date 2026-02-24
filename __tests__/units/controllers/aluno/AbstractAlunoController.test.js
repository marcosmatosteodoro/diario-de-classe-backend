import { AbstractAlunoController } from '../../../../src/controllers/aluno/AbstractAlunoController.js';
import AbstractController from '../../../../src/controllers/abstractController.js';

describe('AbstractAlunoController', () => {
  let mockReq;
  let mockRes;
  beforeEach(() => {
    mockRes = {
      status: function (_code) {
        return this;
      },
      json: function (_data) {
        return this;
      }
    };
  });

  describe('Inicialização', () => {
    test('deve criar uma instância corretamente', () => {
      mockReq = {
        user: {
          id: 'user-123',
          isAdmin: true
        }
      };

      const controller = new AbstractAlunoController(mockReq, mockRes);

      expect(controller).toBeInstanceOf(AbstractAlunoController);
      expect(controller).toBeInstanceOf(AbstractController);
      expect(controller.req).toBe(mockReq);
      expect(controller.res).toBe(mockRes);
    });

    test('deve herdar de AbstractController', () => {
      expect(Object.getPrototypeOf(AbstractAlunoController)).toBe(AbstractController);
    });
  });

  describe('Controle de acesso', () => {
    test('não deve modificar where quando usuário é admin', () => {
      mockReq = {
        user: {
          id: 'admin-123',
          isAdmin: true
        }
      };

      const controller = new AbstractAlunoController(mockReq, mockRes);

      expect(controller.where).toEqual({});
    });

    test('deve definir where quando usuário não é admin', () => {
      const userId = 'professor-123';
      mockReq = {
        user: {
          id: userId,
          isAdmin: false
        }
      };

      const controller = new AbstractAlunoController(mockReq, mockRes);

      expect(controller.where).toEqual({
        aulas: {
          some: {
            idProfessor: userId
          }
        }
      });
    });

    test('deve filtrar por idProfessor correto quando não é admin', () => {
      const userId = 'professor-456';
      mockReq = {
        user: {
          id: userId,
          isAdmin: false
        }
      };

      const controller = new AbstractAlunoController(mockReq, mockRes);

      expect(controller.where.aulas.some.idProfessor).toBe(userId);
    });

    test('deve usar estrutura some para filtrar aulas', () => {
      mockReq = {
        user: {
          id: 'professor-789',
          isAdmin: false
        }
      };

      const controller = new AbstractAlunoController(mockReq, mockRes);

      expect(controller.where).toHaveProperty('aulas');
      expect(controller.where.aulas).toHaveProperty('some');
      expect(controller.where.aulas.some).toHaveProperty('idProfessor');
    });
  });

  describe('Casos especiais', () => {
    test('deve lidar corretamente com isAdmin sendo false explicitamente', () => {
      mockReq = {
        user: {
          id: 'user-999',
          isAdmin: false
        }
      };

      const controller = new AbstractAlunoController(mockReq, mockRes);

      expect(controller.where).toBeDefined();
      expect(controller.where.aulas.some.idProfessor).toBe('user-999');
    });

    test('deve lidar corretamente com isAdmin sendo true explicitamente', () => {
      mockReq = {
        user: {
          id: 'admin-999',
          isAdmin: true
        }
      };

      const controller = new AbstractAlunoController(mockReq, mockRes);

      expect(controller.where).toEqual({});
    });

    test('deve tratar isAdmin undefined como não admin', () => {
      mockReq = {
        user: {
          id: 'user-888'
        }
      };

      const controller = new AbstractAlunoController(mockReq, mockRes);

      expect(controller.where).toBeDefined();
      expect(controller.where.aulas.some.idProfessor).toBe('user-888');
    });

    test('deve tratar isAdmin null como não admin', () => {
      mockReq = {
        user: {
          id: 'user-777',
          isAdmin: null
        }
      };

      const controller = new AbstractAlunoController(mockReq, mockRes);

      expect(controller.where).toBeDefined();
      expect(controller.where.aulas.some.idProfessor).toBe('user-777');
    });

    test('deve tratar isAdmin 0 como não admin', () => {
      mockReq = {
        user: {
          id: 'user-666',
          isAdmin: 0
        }
      };

      const controller = new AbstractAlunoController(mockReq, mockRes);

      expect(controller.where).toBeDefined();
      expect(controller.where.aulas.some.idProfessor).toBe('user-666');
    });

    test('deve tratar isAdmin 1 como admin', () => {
      mockReq = {
        user: {
          id: 'user-555',
          isAdmin: 1
        }
      };

      const controller = new AbstractAlunoController(mockReq, mockRes);

      expect(controller.where).toEqual({});
    });
  });
});
