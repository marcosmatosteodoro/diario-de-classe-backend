// Setup global para testes Jest

// Importar dotenv para variáveis de ambiente de teste
import dotenv from 'dotenv';

// Carregar variáveis de ambiente para testes
dotenv.config({ path: '.env.test' });

// Se não existir .env.test, usar .env
if (!process.env.NODE_ENV) {
  dotenv.config();
}

// Definir ambiente de teste
process.env.NODE_ENV = 'test';

// Mock console.log em testes (opcional)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };
