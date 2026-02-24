import AbstractController from '../abstractController.js';

export class AbstractAlunoController extends AbstractController {
  constructor(req, res) {
    super(req, res);
    if (!req.user.isAdmin) {
      this.where = {
        aulas: {
          some: {
            idProfessor: req.user.id
          }
        }
      };
    }
  }
}
