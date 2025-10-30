#!/usr/bin/env node

/**
 * Script helper para configurar diferentes bancos de dados
 * Uso: node scripts/setup-database.js [sqlite|postgresql|mysql]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '../.env');

const databaseConfigs = {
  sqlite: {
    DATABASE_PROVIDER: 'sqlite',
    DATABASE_URL: 'file:./src/db/dev.db',
    comment: '# Usando SQLite para desenvolvimento'
  },
  postgresql: {
    DATABASE_PROVIDER: 'postgresql',
    DATABASE_URL:
      'postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DATABASE}',
    comment: '# Usando PostgreSQL para produção'
  },
  mysql: {
    DATABASE_PROVIDER: 'mysql',
    DATABASE_URL:
      'mysql://${MYSQL_USER}:${MYSQL_PASSWORD}@${MYSQL_HOST}:${MYSQL_PORT}/${MYSQL_DATABASE}',
    comment: '# Usando MySQL'
  }
};

function updateEnvFile(dbType) {
  if (!databaseConfigs[dbType]) {
    console.error(`❌ Tipo de banco inválido: ${dbType}`);
    console.log('✅ Tipos suportados: sqlite, postgresql, mysql');
    process.exit(1);
  }

  try {
    let envContent = fs.readFileSync(envPath, 'utf8');
    const config = databaseConfigs[dbType];

    // Atualizar DATABASE_PROVIDER
    envContent = envContent.replace(
      /DATABASE_PROVIDER=".*"/,
      `DATABASE_PROVIDER="${config.DATABASE_PROVIDER}"`
    );

    // Atualizar DATABASE_URL
    envContent = envContent.replace(/DATABASE_URL=".*"/, `DATABASE_URL="${config.DATABASE_URL}"`);

    // Adicionar comentário
    envContent = envContent.replace(
      /# === CONFIGURAÇÃO DO BANCO DE DADOS ===/,
      `# === CONFIGURAÇÃO DO BANCO DE DADOS ===\n${config.comment}`
    );

    fs.writeFileSync(envPath, envContent);

    console.log(`✅ Banco de dados configurado para: ${dbType.toUpperCase()}`);
    console.log(`📁 DATABASE_URL: ${config.DATABASE_URL}`);
    console.log('');
    console.log('🔄 Próximos passos:');
    console.log('   npm run db:generate  # Regenerar cliente Prisma');
    console.log('   npm run db:push      # Aplicar schema no banco');
  } catch (error) {
    console.error('❌ Erro ao atualizar arquivo .env:', error.message);
    process.exit(1);
  }
}

// Verificar argumentos
const dbType = process.argv[2];

if (!dbType) {
  console.log('🗄️  Script de Configuração de Banco de Dados');
  console.log('');
  console.log('Uso: node scripts/setup-database.js [tipo]');
  console.log('');
  console.log('Tipos disponíveis:');
  console.log('  sqlite     - SQLite (desenvolvimento)');
  console.log('  postgresql - PostgreSQL (produção)');
  console.log('  mysql      - MySQL (alternativa)');
  console.log('');
  console.log('Exemplo: node scripts/setup-database.js sqlite');
  process.exit(0);
}

updateEnvFile(dbType);
