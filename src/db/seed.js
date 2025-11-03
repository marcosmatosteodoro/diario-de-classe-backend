/**
 * @file Seed do banco de dados
 * @description Script para popular o banco com dados iniciais
 */

import { PrismaClient } from './generated/client/index.js';

const prisma = new PrismaClient();

// Dados dos professores para seed
const professoresSeed = [
  {
    nome: 'Ana',
    sobrenome: 'Silva',
    email: 'ana.silva@blsidiomas.com',
    telefone: '11987654321',
    senha: 'senha123', // Em produção, deve ser hasheada
    permissao: 'admin',
    resetarSenha: false
  },
  {
    nome: 'Carlos',
    sobrenome: 'Santos',
    email: 'carlos.santos@blsidiomas.com',
    telefone: '11876543210',
    senha: 'senha123',
    permissao: 'member',
    resetarSenha: false
  },
  {
    nome: 'Maria',
    sobrenome: 'Oliveira',
    email: 'maria.oliveira@blsidiomas.com',
    telefone: '11765432109',
    senha: 'senha123',
    permissao: 'member',
    resetarSenha: false
  },
  {
    nome: 'João',
    sobrenome: 'Pereira',
    email: 'joao.pereira@blsidiomas.com',
    telefone: '11654321098',
    senha: 'senha123',
    permissao: 'member',
    resetarSenha: true
  },
  {
    nome: 'Fernanda',
    sobrenome: 'Costa',
    email: 'fernanda.costa@blsidiomas.com',
    telefone: '11543210987',
    senha: 'senha123',
    permissao: 'admin',
    resetarSenha: false
  },
  {
    nome: 'Ricardo',
    sobrenome: 'Almeida',
    email: 'ricardo.almeida@blsidiomas.com',
    telefone: '11432109876',
    senha: 'senha123',
    permissao: 'member',
    resetarSenha: false
  },
  {
    nome: 'Juliana',
    sobrenome: 'Ferreira',
    email: 'juliana.ferreira@blsidiomas.com',
    telefone: '11321098765',
    senha: 'senha123',
    permissao: 'member',
    resetarSenha: false
  },
  {
    nome: 'Pedro',
    sobrenome: 'Lima',
    email: 'pedro.lima@blsidiomas.com',
    telefone: '11210987654',
    senha: 'senha123',
    permissao: 'member',
    resetarSenha: true
  },
  {
    nome: 'Camila',
    sobrenome: 'Rodrigues',
    email: 'camila.rodrigues@blsidiomas.com',
    telefone: '11109876543',
    senha: 'senha123',
    permissao: 'admin',
    resetarSenha: false
  },
  {
    nome: 'Bruno',
    sobrenome: 'Martins',
    email: 'bruno.martins@blsidiomas.com',
    telefone: null, // Exemplo sem telefone
    senha: 'senha123',
    permissao: 'member',
    resetarSenha: false
  }
];

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  try {
    // Limpar dados existentes (opcional - descomente se necessário)
    // console.log('🗑️  Limpando dados existentes...');
    // await prisma.user.deleteMany();

    console.log('👥 Criando professores...');

    // Criar professores
    for (const professor of professoresSeed) {
      const user = await prisma.user.create({
        data: professor
      });

      console.log(`✅ Professor criado: ${user.nome} ${user.sobrenome} (${user.email})`);
    }

    // Estatísticas finais
    const totalUsuarios = await prisma.user.count();
    const admins = await prisma.user.count({
      where: { permissao: 'admin' }
    });
    const membros = await prisma.user.count({
      where: { permissao: 'member' }
    });

    console.log('\n📊 Estatísticas do seed:');
    console.log(`   Total de usuários: ${totalUsuarios}`);
    console.log(`   Administradores: ${admins}`);
    console.log(`   Membros: ${membros}`);

    console.log('\n🎉 Seed concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro durante o seed:', error);
    throw error;
  }
}

main()
  .catch(e => {
    console.error('💥 Falha no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
