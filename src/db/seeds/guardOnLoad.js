import { assertSeedAllowed } from './seedGuard.js';

// Importado primeiro em seed.js: os módulos seguintes conectam ao banco ao serem
// carregados (src/db/prisma.js), então a recusa precisa acontecer na avaliação deste módulo.
try {
  assertSeedAllowed();
} catch (e) {
  console.error(`Seed recusado: ${e.message}`);
  process.exit(1);
}
