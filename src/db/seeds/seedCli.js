import './guardOnLoad.js';
import Seed from './seed.js';

// Linha de comando do seed (DEC-004-001 · demonstracao): o guard é o primeiro import para a CLI
// recusar com mensagem e exit 1 antes de carregar qualquer outro módulo — defesa em profundidade
// caso seed.js volte a importar algo que conecte ao banco.
let falhou = false;
try {
  const quantidades = await Seed.handle();
  console.log('🌱 Seed concluído:');
  Object.entries(quantidades).forEach(([etapa, total]) => {
    console.log(`✅ Criado ${total} ${etapa}`);
  });
} catch (e) {
  // Só name/code: a mensagem e o objeto do erro do ORM podem carregar e-mail e senha.
  console.error('💥 Falha no seed:', e?.name, e?.code);
  falhou = true;
} finally {
  try {
    const { default: prisma } = await import('../prisma.js');
    await prisma.$disconnect();
  } catch (e) {
    console.error('💥 Falha ao desconectar:', e?.name, e?.code);
    falhou = true;
  }
}

if (falhou) {
  process.exit(1);
}
