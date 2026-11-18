import { CreateAlunoService } from '../../../services/aluno/createAlunoService.js';
import BaseSeed from '../baseSeed.js';
import { ALUNOS_DEMO } from '../seedCatalogo.js';

export class AlunosSeed extends BaseSeed {
  constructor(params = null) {
    super(params);
  }

  generateMocks() {
    return ALUNOS_DEMO.map(({ nome, sobrenome, email }) => ({
      nome,
      sobrenome,
      email,
      telefone: null,
      criador: null
    }));
  }

  getCreateEntityService() {
    return CreateAlunoService;
  }

  static async handle() {
    const alunosSeed = new AlunosSeed();
    return await alunosSeed.execute();
  }
}
