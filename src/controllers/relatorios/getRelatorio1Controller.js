import { GetAlunoListService } from '../../services/aluno/getAlunoListService.js';
import { generateExcel } from '../../utilities/generateExcel.js';
import AbstractController from '../abstractController.js';

export class GetRelatorio1Controller extends AbstractController {
  constructor(req, res) {
    super(req, res);
  }

  async execute() {
    try {
      const filename = 'Relatório 1 - Alunos';
      const alunos = await GetAlunoListService.handle();
      // Seleciona apenas id e nome
      const data = alunos.map(aluno => ({ id: aluno.id, nome: aluno.nome }));

      const excelBuffer = generateExcel({ res: this.res, filename, data, sheetName: 'Alunos' });
      return this.res.status(200).send(excelBuffer);
    } catch (error) {
      return this.handleError(error, 'configuracaos.list.error');
    }
  }

  static async handle(req, res) {
    const controller = new GetRelatorio1Controller(req, res);
    await controller.execute();
  }
}
