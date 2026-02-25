import AbstractController from '../abstractController.js';

export class AbstractDiaAulaController extends AbstractController {
  constructor(req, res) {
    super(req, res);
    if (!req.user.isAdmin) {
      this.where = {
        aluno: {
          OR: [
            {
              aulas: {
                some: {
                  idProfessor: req.user.id
                }
              }
            },
            {
              criador: req.user.id
            }
          ]
        }
      };
    }
  }
}
