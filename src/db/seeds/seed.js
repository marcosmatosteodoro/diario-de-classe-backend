import { PrismaClient } from '../generated/client/index.js';
import { ProfessoresSeed } from './models/professoresSeed.js';
import { DisponibilidadeProfessorSeed } from './models/disponibilidadeProfessorSeed.js';
import { AlunosSeed } from './models/alunosSeed.js';
import { ContratosSeed } from './models/contratosSeed.js';
import { DiaAulasSeed } from './models/diaAulasSeed.js';
import { AulasSeed } from './models/aulasSeed.js';

export default class Seed {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async executeOld() {
    const prisma = this.prisma;

    // Dados dos professores para seed
    const professoresSeed = [
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
      }
    ];

    // Dados dos alunos para seed
    const alunosSeed = [
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

    console.log('🌱 Iniciando seed do banco de dados...');

    try {
      // Limpar dados existentes (opcional - descomente se necessário)
      // console.log('🗑️  Limpando dados existentes...');
      // await prisma.user.deleteMany();

      console.log('👥 Criando professores...');

      // Criar professores
      for (const professor of professoresSeed) {
        const user = await prisma.user.create({
          data: professor
        });

        console.log(`✅ Professor criado: ${user.nome} ${user.sobrenome} (${user.email})`);
      }

      console.log('\n👨‍🎓 Criando alunos...');

      // Criar alunos
      for (const aluno of alunosSeed) {
        const alunoCreated = await prisma.aluno.create({
          data: aluno
        });

        console.log(
          `✅ Aluno criado: ${alunoCreated.nome} ${alunoCreated.sobrenome} (${alunoCreated.email})`
        );
      }

      // Estatísticas finais
      const totalUsuarios = await prisma.user.count();
      const totalAlunos = await prisma.aluno.count();
      const admins = await prisma.user.count({
        where: { permissao: 'admin' }
      });
      const membros = await prisma.user.count({
        where: { permissao: 'member' }
      });

      console.log('\n📊 Estatísticas do seed:');
      console.log(`   Total de usuários: ${totalUsuarios}`);
      console.log(`   Total de alunos: ${totalAlunos}`);
      console.log(`   Administradores: ${admins}`);
      console.log(`   Membros: ${membros}`);

      console.log('\n🎉 Seed concluído com sucesso!');
    } catch (error) {
      console.error('❌ Erro durante o seed:', error);
      throw error;
    }
  }

  async execute() {
    console.log('🌱 Iniciando seed do banco de dados...');

    console.log('👥 Criando professores...');
    this.professores = await ProfessoresSeed.handle();

    console.log('👥 Criando disponibilidades de professores...');
    this.disponibilidadeProfessores = await DisponibilidadeProfessorSeed.handle({
      professores: this.professores
    });

    console.log('👥 Criando alunos...');
    this.alunos = await AlunosSeed.handle();

    console.log('👥 Criando contratos...');
    this.contratos = await ContratosSeed.handle({ alunos: this.alunos });

    console.log('👥 Criando dias de aulas...');
    this.diaAulas = await DiaAulasSeed.handle({ alunos: this.alunos, contratos: this.contratos });

    console.log('👥 Criando aulas...');
    this.aulas = await AulasSeed.handle({
      alunos: this.alunos,
      contratos: this.contratos,
      professores: this.professores
    });

    console.log(`✅ Criado ${this.professores.length} professores`);
    console.log(`✅ Criado ${this.disponibilidadeProfessores.length} disponibilidadeProfessores`);
    console.log(`✅ Criado ${this.alunos.length} alunos`);
    console.log(`✅ Criado ${this.contratos.length} contratos`);
    console.log(`✅ Criado ${this.diaAulas.length} diaAulas`);
    console.log(`✅ Criado ${this.aulas.length} aulas`);
  }

  static async handle() {
    const prisma = new PrismaClient();
    const seed = new Seed(prisma);

    seed
      .execute()
      .catch(e => {
        console.error('💥 Falha no seed:', e);
        process.exit(1);
      })
      .finally(async () => {
        await prisma.$disconnect();
      });
  }
}

Seed.handle();
