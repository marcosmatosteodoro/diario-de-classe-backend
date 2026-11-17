import { PrismaClient } from './generated/client/index.js';
import Constants from '../utilities/constants.js';
import { prismaLogLevels } from './prismaLogLevels.js';

// Cria uma única instância do Prisma Client
const prisma = new PrismaClient({
  log: prismaLogLevels(Constants.isProduction)
});

// Conecta ao banco automaticamente
await prisma.$connect();

export default prisma;
