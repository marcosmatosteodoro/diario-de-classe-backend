import { PrismaClient } from './generated/client/index.js';

// Cria uma única instância do Prisma Client
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});

// Conecta ao banco automaticamente
await prisma.$connect();

export default prisma;
