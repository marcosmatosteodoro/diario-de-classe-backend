import AbstractController from '../abstractController.js';
import { GetAlunoService } from '../../services/aluno/getAlunoService.js';

/**
 * Base dos controllers de cronograma.
 *
 * Repete de proposito o filtro de AbstractAlunoController: professor nao-admin
 * so alcanca aluno que ele atende ou que ele criou. O cronograma expoe o
 * historico pedagogico do aluno, entao o vinculo e conferido no servidor a cada
 * requisicao -- nunca a partir de id que venha no corpo.
 *
 * Expoe dois filtros porque as consultas caem em entidades diferentes:
 * - `whereAluno`: aplicado sobre Aluno;
 * - `where`: aplicado sobre CronogramaAluno, com o filtro aninhado em `aluno`.
 */
export class AbstractCronogramaController extends AbstractController {
  constructor(req, res) {
    super(req, res);
    this.whereAluno = {};

    if (!req.user.isAdmin) {
      const vinculoDoProfessor = {
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

      this.whereAluno = vinculoDoProfessor;
      this.where = { aluno: vinculoDoProfessor };
    }
  }

  /**
   * Busca o aluno respeitando o vinculo do professor. Devolve null quando o
   * aluno nao existe OU quando existe mas nao pertence a este professor: nos
   * dois casos a resposta e 404, para nao revelar a existencia do cadastro.
   *
   * @param {string} idAluno
   * @returns {Promise<Object|null>}
   */
  async getAlunoAcessivel(idAluno) {
    return await GetAlunoService.handle(idAluno, this.whereAluno);
  }
}
