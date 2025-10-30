import js from '@eslint/js';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  prettierConfig,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        // Variáveis globais do Node.js
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly'
      }
    },
    plugins: {
      prettier
    },
    rules: {
      // === REGRAS DO PRETTIER ===
      // Integra o Prettier com o ESLint para formatação automática
      'prettier/prettier': 'error',

      // === REGRAS DE QUALIDADE DE CÓDIGO ===
      // Força o uso de === e !== ao invés de == e !=
      eqeqeq: ['error', 'always'],

      // Proíbe variáveis não utilizadas (exceto argumentos que começam com _)
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],

      // Proíbe console.log em produção (apenas aviso)
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',

      // Proíbe debugger em produção
      'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'warn',

      // Proíbe variáveis indefinidas
      'no-undef': 'error',

      // NOTA: Regras de formatação (aspas, indentação, espaços, etc.) são controladas pelo Prettier
      // O eslint-config-prettier desabilita automaticamente regras conflitantes

      // === REGRAS DE BOAS PRÁTICAS ===
      // Força uso de const quando a variável não é reatribuída
      'prefer-const': 'error',

      // Proíbe uso de var, força let/const
      'no-var': 'error',

      // Força uso de template literals ao invés de concatenação
      'prefer-template': 'error',

      // Proíbe funções construtoras sem new
      'no-new': 'error',

      // Proíbe comparação com NaN, força uso de Number.isNaN()
      'use-isnan': 'error',

      // Proíbe modificação de parâmetros de função
      'no-param-reassign': 'warn',

      // Força return consistente em funções
      'consistent-return': 'error',

      // === REGRAS ESPECÍFICAS PARA NODE.JS ===
      // Proíbe require() dentro de blocos condicionais
      'no-require-in-root': 'off', // Desabilitado para ES modules

      // Força uso de path.join() para caminhos de arquivos
      'no-path-concat': 'off', // Não aplicável para ES modules

      // === REGRAS DE COMPLEXIDADE ===
      // Limita complexidade ciclomática das funções
      complexity: ['warn', 10],

      // Limita o número de parâmetros em funções
      'max-params': ['warn', 4],

      // Limita o tamanho de funções em linhas
      'max-lines-per-function': ['warn', { max: 50, skipBlankLines: true, skipComments: true }],

      // Limita profundidade de aninhamento
      'max-depth': ['warn', 4],

      // === REGRAS DE SEGURANÇA ===
      // Proíbe uso de eval()
      'no-eval': 'error',

      // Proíbe uso de Function constructor
      'no-new-func': 'error',

      // Proíbe uso de with
      'no-with': 'error',

      // Proíbe declarações implícitas de globals
      'no-implicit-globals': 'error'
    }
  },
  {
    // Configurações específicas para arquivos de configuração
    files: ['*.config.js', 'eslint.config.js'],
    rules: {
      // Permite console.log em arquivos de configuração
      'no-console': 'off'
    }
  }
];
