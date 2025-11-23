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
    this.seeds = [
      'professores',
      'disponibilidadeProfessores',
      'alunos',
      'contratos',
      'diaAulas',
      'aulas'
    ];
  }

  async execute() {
    console.log('🌱 Iniciando seed do banco de dados...');

    console.log('👥 Criando professores...');
    this.professores = await ProfessoresSeed.handle(this.params);
    this.updateParams();

    console.log('👥 Criando disponibilidades de professores...');
    this.disponibilidadeProfessores = await DisponibilidadeProfessorSeed.handle(this.params);
    this.updateParams();

    console.log('👥 Criando alunos...');
    this.alunos = await AlunosSeed.handle(this.params);
    this.updateParams();

    console.log('👥 Criando contratos...');
    this.contratos = await ContratosSeed.handle(this.params);
    this.updateParams();

    console.log('👥 Criando dias de aulas...');
    this.diaAulas = await DiaAulasSeed.handle(this.params);
    this.updateParams();

    console.log('👥 Criando aulas...');
    this.aulas = await AulasSeed.handle(this.params);
    this.updateParams();

    this.successLog();
  }

  updateParams() {
    this.params = {
      professores: this.professores,
      disponibilidadeProfessores: this.disponibilidadeProfessores,
      alunos: this.alunos,
      contratos: this.contratos,
      diaAulas: this.diaAulas,
      aulas: this.aulas
    };
  }

  successLog() {
    this.seeds.forEach(seed => {
      console.log(`✅ Criado ${this[seed].length} ${seed}`);
    });
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
