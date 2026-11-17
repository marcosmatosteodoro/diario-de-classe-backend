import { PrismaClient } from './generated/client/index.js';
import { prismaClientOptions } from './prismaLogLevels.js';

// Cria uma única instância do Prisma Client
const prisma = new PrismaClient(prismaClientOptions());

// Conecta ao banco automaticamente
await prisma.$connect();

export default prisma;
