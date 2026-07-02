/**
 * Mock do Prisma Client para testes unitários.
 *
 * Substitui `src/db/prisma.js` via `moduleNameMapper` (ver jest.config.js),
 * garantindo que NENHUM teste unitário conecte ou altere um banco real.
 *
 * Para qualquer modelo acessado (ex.: `prisma.aluno`), expõe os métodos do
 * delegate do Prisma com retornos padrão equivalentes aos de um banco vazio
 * (findMany -> [], findFirst/findUnique -> null, etc.). São funções simples
 * (não `jest.fn`) para sobreviverem ao `resetMocks: true` do Jest; um teste
 * que precise de dados específicos deve injetar um repositório/serviço mockado,
 * como já é feito na suíte.
 *
 * Cada modelo é cacheado para manter a mesma referência entre acessos
 * (ex.: `repository.getEntity() === repository.entity`) e recebe um `name` no
 * padrão do delegate do Prisma (ex.: `Aluno`).
 */
const createModel = name => ({
  name,
  findMany: async () => [],
  findFirst: async () => null,
  findUnique: async () => null,
  findUniqueOrThrow: async () => ({}),
  findFirstOrThrow: async () => ({}),
  create: async () => ({}),
  createMany: async () => ({ count: 0 }),
  update: async () => ({}),
  updateMany: async () => ({ count: 0 }),
  upsert: async () => ({}),
  delete: async () => ({}),
  deleteMany: async () => ({ count: 0 }),
  count: async () => 0,
  aggregate: async () => ({}),
  groupBy: async () => []
});

const cache = new Map();

const clientMethods = {
  $connect: async () => undefined,
  $disconnect: async () => undefined,
  $on: () => undefined,
  $use: () => undefined,
  $extends: () => prismaMock,
  $queryRaw: async () => [],
  $queryRawUnsafe: async () => [],
  $executeRaw: async () => 0,
  $executeRawUnsafe: async () => 0,
  $transaction: async arg => {
    if (typeof arg === 'function') {
      return arg(prismaMock);
    }
    if (Array.isArray(arg)) {
      return Promise.all(arg);
    }
    return undefined;
  }
};

const prismaMock = new Proxy(
  {},
  {
    get(_target, prop) {
      // Symbols e checagem de thenable (para não ser tratado como Promise).
      if (typeof prop === 'symbol' || prop === 'then') {
        return undefined;
      }

      if (prop in clientMethods) {
        return clientMethods[prop];
      }

      if (!cache.has(prop)) {
        const name = prop.charAt(0).toUpperCase() + prop.slice(1);
        cache.set(prop, createModel(name));
      }
      return cache.get(prop);
    }
  }
);

export default prismaMock;
