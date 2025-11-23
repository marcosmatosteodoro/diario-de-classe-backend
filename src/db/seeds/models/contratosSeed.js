import { CreateContratoService } from '../../../services/contrato/createContratoService.js';
import BaseSeed from '../baseSeed.js';

export class ContratosSeed extends BaseSeed {
  constructor(params = null) {
    super(params);
  }

  getDisponibilidade(aluno) {
    const agora = new Date();

    return {
      idAluno: aluno.id,
      dataInicio: agora,
      dataTermino: new Date(agora.setMonth(agora.getMonth() + 6))
    };
  }

  generateMocks(alunos) {
    const models = [];

    alunos.map(aluno => {
      const model = this.getDisponibilidade(aluno);
      models.push(model);
    });

    return models;
  }

  getCreateEntityService() {
    return CreateContratoService;
  }

  static async handle(alunos) {
    const contratosSeed = new ContratosSeed(alunos);
    return await contratosSeed.execute();
  }
}
