import { CreateUserService } from '../../../services/user/createUserService.js';
import BaseSeed from '../baseSeed.js';

export class ProfessoresSeed extends BaseSeed {
  constructor(params = null) {
    super(params);
  }

  generateMocks() {
    return [
      {
        nome: 'Ana',
        sobrenome: 'Silva',
        email: 'ana.silva@blsidiomas.com',
        telefone: '11987654321',
        senha: 'senha123', // Em produção, deve ser hasheada
        permissao: 'admin',
        resetarSenha: false
      },
      {
        nome: 'Carlos',
        sobrenome: 'Santos',
        email: 'carlos.santos@blsidiomas.com',
        telefone: '11876543210',
        senha: 'senha123',
        permissao: 'member',
        resetarSenha: false
      },
      {
        nome: 'Maria',
        sobrenome: 'Oliveira',
        email: 'maria.oliveira@blsidiomas.com',
        telefone: '11765432109',
        senha: 'senha123',
        permissao: 'member',
        resetarSenha: false
      },
      {
        nome: 'João',
        sobrenome: 'Pereira',
        email: 'joao.pereira@blsidiomas.com',
        telefone: '11654321098',
        senha: 'senha123',
        permissao: 'member',
        resetarSenha: true
      },
      {
        nome: 'Fernanda',
        sobrenome: 'Costa',
        email: 'fernanda.costa@blsidiomas.com',
        telefone: '11543210987',
        senha: 'senha123',
        permissao: 'admin',
        resetarSenha: false
      },
      {
        nome: 'Ricardo',
        sobrenome: 'Almeida',
        email: 'ricardo.almeida@blsidiomas.com',
        telefone: '11432109876',
        senha: 'senha123',
        permissao: 'member',
        resetarSenha: false
      },
      {
        nome: 'Juliana',
        sobrenome: 'Ferreira',
        email: 'juliana.ferreira@blsidiomas.com',
        telefone: '11321098765',
        senha: 'senha123',
        permissao: 'member',
        resetarSenha: false
      },
      {
        nome: 'Pedro',
        sobrenome: 'Lima',
        email: 'pedro.lima@blsidiomas.com',
        telefone: '11210987654',
        senha: 'senha123',
        permissao: 'member',
        resetarSenha: true
      },
      {
        nome: 'Camila',
        sobrenome: 'Rodrigues',
        email: 'camila.rodrigues@blsidiomas.com',
        telefone: '11109876543',
        senha: 'senha123',
        permissao: 'admin',
        resetarSenha: false
      },
      {
        nome: 'Bruno',
        sobrenome: 'Martins',
        email: 'bruno.martins@blsidiomas.com',
        telefone: null, // Exemplo sem telefone
        senha: 'senha123',
        permissao: 'member',
        resetarSenha: false
      },
      {
        nome: 'BLS Idiomas',
        sobrenome: 'admin',
        email: 'contato@blsrio.com.br',
        telefone: null, // Exemplo sem telefone
        senha: 'contato@blsrio.com.br',
        permissao: 'admin',
        resetarSenha: false
      }
    ];
  }

  getCreateEntityService() {
    return CreateUserService;
  }

  static async handle() {
    const professoresSeed = new ProfessoresSeed();
    return await professoresSeed.execute();
  }
}
