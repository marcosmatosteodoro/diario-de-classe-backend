import { AbstractAulaController } from '../../../../src/controllers/aula/AbstractAulaController.js';
import AbstractController from '../../../../src/controllers/abstractController.js';

/**
 * O filtro "só minhas aulas" para
 * não-admin vive aqui, no construtor — isolar este teste prova o filtro em
 * si, sem depender de nenhum controller concreto.
 */
describe('AbstractAulaController', () => {
  let mockRes;

  beforeEach(() => {
    mockRes = {
      status: function () {
        return this;
      },
      json: function () {
        return this;
      }
    };
  });

  describe('Inicialização', () => {
    test('deve herdar de AbstractController', () => {
      const controller = new AbstractAulaController({ user: { id: 'u1', isAdmin: true } }, mockRes);

      expect(controller).toBeInstanceOf(AbstractAulaController);
      expect(controller).toBeInstanceOf(AbstractController);
    });
  });

  describe('Filtro por professor (não-admin só vê as próprias aulas)', () => {
    test('admin: where permanece {} (sem filtro por professor)', () => {
      const controller = new AbstractAulaController(
        { user: { id: 'admin-1', isAdmin: true } },
        mockRes
      );

      expect(controller.where).toEqual({});
    });

    test('não-admin: where é restrito a idProfessor = req.user.id', () => {
      const controller = new AbstractAulaController(
        { user: { id: 'professor-123', isAdmin: false } },
        mockRes
      );

      expect(controller.where).toEqual({ idProfessor: 'professor-123' });
    });

    test('isAdmin undefined é tratado como não-admin (filtro aplicado)', () => {
      const controller = new AbstractAulaController({ user: { id: 'user-1' } }, mockRes);

      expect(controller.where).toEqual({ idProfessor: 'user-1' });
    });

    test('isAdmin null é tratado como não-admin (filtro aplicado)', () => {
      const controller = new AbstractAulaController(
        { user: { id: 'user-2', isAdmin: null } },
        mockRes
      );

      expect(controller.where).toEqual({ idProfessor: 'user-2' });
    });
  });

  describe('Requisito da fronteira (req.user)', () => {
    test('sem req.user, o construtor estoura — não existe checagem defensiva aqui', () => {
      expect(() => new AbstractAulaController({}, mockRes)).toThrow();
    });
  });
});
