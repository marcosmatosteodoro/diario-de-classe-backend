import { CreateAlunoService } from '../../../services/aluno/createAlunoService.js';
import BaseSeed from '../baseSeed.js';

export class AlunosSeed extends BaseSeed {
  constructor(params = null) {
    super(params);
  }

  generateMocks() {
    return [
      {
        nome: 'Lucas',
        sobrenome: 'Mendes',
        email: 'lucas.mendes@gmail.com',
        telefone: '11987654321',
        criador: null
      },
      {
        nome: 'Isabella',
        sobrenome: 'Castro',
        email: 'isabella.castro@gmail.com',
        telefone: '11876543210',
        criador: null
      },
      {
        nome: 'Gabriel',
        sobrenome: 'Rocha',
        email: 'gabriel.rocha@gmail.com',
        telefone: '11765432109',
        criador: null
      },
      {
        nome: 'Sophia',
        sobrenome: 'Cardoso',
        email: 'sophia.cardoso@gmail.com',
        telefone: '11654321098',
        criador: null
      },
      {
        nome: 'Miguel',
        sobrenome: 'Barbosa',
        email: 'miguel.barbosa@gmail.com',
        telefone: '11543210987',
        criador: null
      },
      {
        nome: 'Alice',
        sobrenome: 'Nascimento',
        email: 'alice.nascimento@gmail.com',
        telefone: '11432109876',
        criador: null
      },
      {
        nome: 'Arthur',
        sobrenome: 'Dias',
        email: 'arthur.dias@gmail.com',
        telefone: '11321098765',
        criador: null
      },
      {
        nome: 'Helena',
        sobrenome: 'Araújo',
        email: 'helena.araujo@gmail.com',
        telefone: '11210987654',
        criador: null
      },
      {
        nome: 'Heitor',
        sobrenome: 'Sousa',
        email: 'heitor.sousa@gmail.com',
        telefone: null, // Exemplo sem telefone
        criador: null
      },
      {
        nome: 'Laura',
        sobrenome: 'Ribeiro',
        email: 'laura.ribeiro@gmail.com',
        telefone: '11098765432',
        criador: null
      }
    ];
  }

  getCreateEntityService() {
    return CreateAlunoService;
  }

  static async handle() {
    const professoresSeed = new AlunosSeed();
    return await professoresSeed.execute();
  }
}
