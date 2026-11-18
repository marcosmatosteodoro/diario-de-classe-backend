import { CreateContratoService } from '../../../services/contrato/createContratoService.js';
import BaseSeed from '../baseSeed.js';

export class ContratosSeed extends BaseSeed {
  constructor(params = null) {
    super(params);
  }

  generateMocks(params) {
    if (!params || !params.contratos || params.contratos.length === 0) {
      throw new Error('Contratos não encontrados para gerar seeds de contratos');
    }

    return params.contratos.map(contrato => ({
      idAluno: params.idAlunoPorChave.get(contrato.chaveAluno),
      dataInicio: contrato.dataInicio,
      dataTermino: contrato.dataTermino,
      status: contrato.status
    }));
  }

  getCreateEntityService() {
    return CreateContratoService;
  }

  static async handle(params) {
    const contratosSeed = new ContratosSeed(params);
    return await contratosSeed.execute();
  }
}
