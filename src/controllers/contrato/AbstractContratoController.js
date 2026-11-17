import AbstractController from '../abstractController.js';

export class AbstractContratoController extends AbstractController {
  constructor(req, res) {
    super(req, res);
    if (!req.user.isAdmin) {
      this.where = AbstractContratoController.ownerWhere(req.user.id);
    }
  }

  static ownerWhere(userId) {
    return {
      aulas: {
        some: {
          idProfessor: userId
        }
      }
    };
  }
}
