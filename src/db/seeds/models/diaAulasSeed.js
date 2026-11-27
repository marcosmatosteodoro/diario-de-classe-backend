import { CreateDiaAulaService } from '../../../services/diaAula/createDiaAulaService.js';
import BaseSeed from '../baseSeed.js';

export class DiaAulasSeed extends BaseSeed {
  constructor(params = null) {
    super(params);
  }

  getCreateEntityService() {
    return CreateDiaAulaService;
  }

  generateMocks(params) {
    if (!params || !params.diasAula || params.diasAula.length === 0) {
      throw new Error('Dias de aula não encontrados para gerar seeds dos dias de aulas');
    }

    return params.diasAula.map(dia => ({
      idAluno: params.idAlunoPorChave.get(dia.chaveAluno),
      idContrato: params.idContratoPorChaveAluno.get(dia.chaveAluno),
      diaSemana: dia.diaSemana,
      quantidadeAulas: dia.quantidadeAulas,
      horaInicial: dia.horaInicial,
      horaFinal: dia.horaFinal
    }));
  }

  static async handle(params) {
    const diaAulasSeed = new DiaAulasSeed(params);
    return await diaAulasSeed.execute();
  }
}
