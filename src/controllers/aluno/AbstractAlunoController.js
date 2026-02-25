import AbstractController from '../abstractController.js';

export class AbstractAlunoController extends AbstractController {
  constructor(req, res) {
    super(req, res);
    if (!req.user.isAdmin) {
      this.where = {
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
      };
    }
  }
}
