import AbstractController from '../abstractController.js';

export class AbstractDiaAulaController extends AbstractController {
  constructor(req, res) {
    super(req, res);
    if (!req.user.isAdmin) {
      this.where = {
        aluno: {
          aulas: {
            some: {
              idProfessor: req.user.id
            }
          }
        }
      };
    }
  }
}
