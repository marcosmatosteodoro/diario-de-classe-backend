export default {
  // Ambiente de teste
  testEnvironment: 'node',

  // Usar ES Modules
  preset: null,

  // Transformação para ES Modules
  transform: {},

  // Padrões de arquivos de teste
  testMatch: ['**/__tests__/**/*.test.js', '**/__tests__/**/*.spec.js'],

  // Diretórios a serem ignorados
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/build/'],

  // Configuração de cobertura
  collectCoverage: false, // Desabilitado por enquanto para simplificar
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/db/prisma/**',
    '!src/db/generated/**'
  ],

  // Diretório de cobertura
  coverageDirectory: 'coverage',

  // Formato dos relatórios de cobertura
  coverageReporters: ['text', 'lcov', 'html'],

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],

  // Limpar mocks automaticamente
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  // Timeout para testes
  testTimeout: 10000,

  // Verbose output
  verbose: true
};
