import { CreateAulaService } from '../../../services/aula/createAulaService.js';
import BaseSeed from '../baseSeed.js';

export class AulasSeed extends BaseSeed {
  constructor(params = null) {
    super(params);
  }

  getCreateEntityService() {
    return CreateAulaService;
  }

  generateMocks(params) {
    if (!params || !params.aulas || params.aulas.length === 0) {
      throw new Error('Aulas não encontradas para gerar seeds das aulas');
    }

    return params.aulas.map(aula => ({
      idAluno: params.idAlunoPorChave.get(aula.chaveAluno),
      idProfessor: params.idProfessorPorChave.get(aula.chaveProfessor),
      idContrato: params.idContratoPorChaveAluno.get(aula.chaveAluno),
      dataAula: aula.dataAula,
      horaInicial: aula.horaInicial,
      horaFinal: aula.horaFinal,
      status: aula.status,
      tipo: aula.tipo,
      observacao: aula.observacao
    }));
  }

  static async handle(params) {
    const aulasSeed = new AulasSeed(params);
    return await aulasSeed.execute();
  }
}
