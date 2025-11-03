# 🌱 Database Seeding

## 📋 Sobre o Seed

O arquivo `src/db/seed.js` contém dados iniciais para popular o banco de dados com 10 professores de exemplo.

## 🎯 Dados Incluídos

### 👥 **10 Professores:**

- **3 Administradores**: Ana Silva, Fernanda Costa, Camila Rodrigues
- **7 Membros**: Carlos Santos, Maria Oliveira, João Pereira, Ricardo Almeida, Juliana Ferreira, Pedro Lima, Bruno Martins

### 📊 **Características:**

- ✅ Nomes e sobrenomes realistas
- ✅ Emails padronizados (@blsidiomas.com)
- ✅ Telefones variados (alguns com null)
- ✅ Mix de permissões (admin/member)
- ✅ Alguns usuários precisam resetar senha
- ✅ Senhas simples para desenvolvimento (devem ser hasheadas em produção)

## 🚀 Como Executar

### **1. Preparar o banco:**

```bash
# Gerar cliente Prisma
npm run db:generate

# Aplicar schema no banco
npm run db:push
```

### **2. Executar o seed:**

```bash
npm run db:seed
```

### **3. Verificar os dados:**

```bash
# Abrir Prisma Studio
npm run db:studio
```

## 📝 Exemplo de Output

```
🌱 Iniciando seed do banco de dados...
👥 Criando professores...
✅ Professor criado: Ana Silva (ana.silva@blsidiomas.com)
✅ Professor criado: Carlos Santos (carlos.santos@blsidiomas.com)
✅ Professor criado: Maria Oliveira (maria.oliveira@blsidiomas.com)
✅ Professor criado: João Pereira (joao.pereira@blsidiomas.com)
✅ Professor criado: Fernanda Costa (fernanda.costa@blsidiomas.com)
✅ Professor criado: Ricardo Almeida (ricardo.almeida@blsidiomas.com)
✅ Professor criado: Juliana Ferreira (juliana.ferreira@blsidiomas.com)
✅ Professor criado: Pedro Lima (pedro.lima@blsidiomas.com)
✅ Professor criado: Camila Rodrigues (camila.rodrigues@blsidiomas.com)
✅ Professor criado: Bruno Martins (bruno.martins@blsidiomas.com)

📊 Estatísticas do seed:
   Total de usuários: 10
   Administradores: 3
   Membros: 7

🎉 Seed concluído com sucesso!
```

## ⚠️ **Importante**

- **Desenvolvimento**: As senhas são simples (`senha123`)
- **Produção**: Implementar hash de senhas (bcrypt/argon2)
- **Limpeza**: Descomente `await prisma.user.deleteMany()` para limpar dados existentes
- **Duplicatas**: O seed pode gerar erro se emails já existirem

## 🔧 Personalização

Para modificar os dados do seed, edite o array `professoresSeed` em `src/db/seed.js`:

```javascript
const professoresSeed = [
  {
    nome: 'Seu',
    sobrenome: 'Nome',
    email: 'seu.email@blsidiomas.com',
    telefone: '11999999999',
    senha: 'suasenha',
    permissao: 'admin', // ou 'member'
    resetarSenha: false
  }
  // ... mais professores
];
```
