import './guardOnLoad.js';
import { PrismaClient } from '../generated/client/index.js';
import Constants from '../../utilities/constants.js';
import { diaCivilSaoPaulo } from './seedCalendario.js';

export default class Seed {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async execute() {
    console.log('🌱 Iniciando seed do banco de dados...');

    const { executarEtapas } = await import('./seedEtapas.js');
    const contagens = await executarEtapas({
      hoje: diaCivilSaoPaulo(new Date()),
      senha: Constants.seedPassword
    });

    Object.entries(contagens).forEach(([etapa, total]) => {
      console.log(`✅ Criado ${total} ${etapa}`);
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
