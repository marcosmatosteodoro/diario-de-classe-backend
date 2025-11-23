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

  generateMocks(params) {
    const models = [];

    if (!params || !params.alunos || params.alunos.length === 0) {
      throw new Error('Alunos não encontrados para gerar seeds de contratos');
    }

    const { alunos } = params;

    alunos.map(aluno => {
      const model = this.getDisponibilidade(aluno);
      models.push(model);
    });

    return models;
  }

  getCreateEntityService() {
    return CreateContratoService;
  }

  static async handle(params) {
    const contratosSeed = new ContratosSeed(params);
    return await contratosSeed.execute();
  }
}
