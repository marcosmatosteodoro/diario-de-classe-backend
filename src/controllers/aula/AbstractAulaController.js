import AbstractController from '../abstractController.js';

export class AbstractAulaController extends AbstractController {
  constructor(req, res) {
    super(req, res);
    if (!req.user.isAdmin) {
      this.where = {
        idProfessor: req.user.id
      };
    }
  }
}
