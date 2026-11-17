import AbstractController from '../abstractController.js';

export class AbstractDiaAulaController extends AbstractController {
  constructor(req, res) {
    super(req, res);
    if (!req.user.isAdmin) {
      this.where = AbstractDiaAulaController.ownerWhere(req.user.id);
    }
  }

  static ownerWhere(userId) {
    return {
      aluno: {
        OR: [
          {
            aulas: {
              some: {
                idProfessor: userId
              }
            }
          },
          {
            criador: userId
          }
        ]
      }
    };
  }
}
