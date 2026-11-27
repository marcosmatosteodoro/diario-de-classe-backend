import { CreateUserService } from '../../../services/user/createUserService.js';
import BaseSeed from '../baseSeed.js';
import { CONTAS_FIXAS_DEMO, PROFESSORES_DEMO } from '../seedCatalogo.js';

export class ProfessoresSeed extends BaseSeed {
  constructor(params = null) {
    super(params);
  }

  generateMocks(params) {
    if (!params || typeof params.senha !== 'string' || params.senha === '') {
      throw new Error('Senha não informada para gerar seeds dos professores');
    }

    return [...CONTAS_FIXAS_DEMO, ...PROFESSORES_DEMO].map(
      ({ nome, sobrenome, email, telefone, permissao, resetarSenha }) => ({
        nome,
        sobrenome,
        email,
        telefone,
        senha: params.senha,
        permissao,
        resetarSenha
      })
    );
  }

  getCreateEntityService() {
    return CreateUserService;
  }

  static async handle(params) {
    const professoresSeed = new ProfessoresSeed(params);
    return await professoresSeed.execute();
  }
}
