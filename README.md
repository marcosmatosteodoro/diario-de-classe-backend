# 📚 Diário de Classe - Backend API

Uma API moderna em Node.js com Express para sistema de diário de classe, com suporte completo a internacionalização e múltiplos bancos de dados.

## 🚀 Tecnologias

- **Node.js** com ES Modules
- **Express.js 5.1.0** - Framework web
- **Prisma ORM 6.18.0** - ORM moderno com suporte multi-database
- **i18next** - Internacionalização (Português/Inglês)
- **ESLint + Prettier** - Qualidade e formatação de código
- **SQLite/PostgreSQL/MySQL** - Suporte flexível a bancos de dados

## 📋 Funcionalidades

- ✅ API RESTful com middleware de segurança
- ✅ Internacionalização completa (PT/EN)
- ✅ ORM com múltiplos bancos de dados
- ✅ Validação de dados
- ✅ Logs estruturados
- ✅ Tratamento de erros centralizado
- ✅ Configuração flexível por ambiente

## 🛠️ Instalação

```bash
# Clone o repositório
git clone <repo-url>
cd diario-de-classe-backend

# Instale as dependências
npm install

# Configure o banco de dados (SQLite por padrão)
npm run db:setup:sqlite

# Gere o cliente Prisma
npm run db:generate

# Aplique o schema no banco
npm run db:push
```

## 🗄️ Configuração de Banco de Dados

### SQLite (Desenvolvimento - Padrão)

```bash
npm run db:setup:sqlite
```

### PostgreSQL (Produção)

```bash
npm run db:setup:postgresql
# Depois configure as variáveis no .env:
# POSTGRES_HOST, POSTGRES_PORT, POSTGRES_DATABASE, etc.
```

### MySQL (Alternativa)

```bash
npm run db:setup:mysql
# Configure as variáveis MYSQL_* no .env
```

## 🏁 Como Executar

```bash
# Desenvolvimento
npm run dev

# Produção
npm start

# Prisma Studio (visualizar dados)
npm run db:studio
```

## 📡 Endpoints da API

### Health Check

- `GET /` - Status da API
- `GET /health` - Health check detalhado

### Usuários

- `GET /api/users` - Listar usuários
- `POST /api/users` - Criar usuário

### Internacionalização

Use o header `Accept-Language` ou query `?lng=pt|en` para alternar idiomas.

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Servidor com hot reload
npm start           # Servidor produção

# Banco de dados
npm run db:generate  # Gerar cliente Prisma
npm run db:push     # Aplicar schema
npm run db:migrate  # Criar migração
npm run db:studio   # Interface visual
npm run db:reset    # Reset completo

# Configuração de banco
npm run db:setup:sqlite      # Configurar SQLite
npm run db:setup:postgresql  # Configurar PostgreSQL
npm run db:setup:mysql       # Configurar MySQL

# Código
npm run lint        # Verificar código
npm run lint:fix    # Corrigir automaticamente
npm run format      # Formatar código
```

## 🌍 Estrutura de Arquivos

```
src/
├── app.js                 # Configuração do Express
├── server.js             # Entry point
├── routes/               # Rotas da API
│   ├── routes.js        # Rotas principais (health/welcome)
│   └── users.js         # Rotas de usuários
├── controllers/          # Lógica de negócio
│   ├── healthController.js # Health check e welcome
│   └── usersController.js  # CRUD de usuários
├── middlewares/          # Middlewares customizados
│   ├── i18n.js          # Configuração i18n
│   └── errorHandler.js  # Tratamento de erros
├── utilities/           # Utilitários
│   ├── constants.js     # Constantes globais
│   ├── logger.js        # Sistema de logs
│   └── i18nConfig.js    # Config internacionalização
├── db/                  # Banco de dados
│   ├── prisma/
│   │   └── schema.prisma # Schema do banco
│   └── client.js        # Cliente Prisma
└── locales/             # Traduções
    ├── pt/translation.json
    └── en/translation.json
```

## 🔐 Variáveis de Ambiente

O arquivo `.env` contém todas as configurações necessárias:

- `NODE_ENV` - Ambiente (development/production)
- `PORT` - Porta do servidor (padrão: 3000)
- `DATABASE_PROVIDER` - Tipo de banco (sqlite/postgresql/mysql)
- `DATABASE_URL` - URL de conexão do banco

## 🏗️ Arquitetura

O projeto segue uma arquitetura baseada no padrão **MVC (Model-View-Controller)**:

- **Models**: Definidos no Prisma Schema (`src/db/prisma/schema.prisma`)
- **Views**: Respostas JSON estruturadas pelos controllers
- **Controllers**: Lógica de negócio em `src/controllers/`
- **Routes**: Definição de endpoints em `src/routes/`
- **Middlewares**: Funcionalidades transversais (auth, i18n, logs)

### Fluxo de Requisição
```
Request → Middleware → Route → Controller → Model (Prisma) → Response
```

## 👥 Desenvolvimento

### Adicionando Nova Funcionalidade

1. **Controller**: Crie em `src/controllers/nomeController.js`
   ```javascript
   export const actionName = async (req, res) => {
     // Lógica aqui
   };
   ```

2. **Route**: Crie em `src/routes/nome.js`
   ```javascript
   import { actionName } from '../controllers/nomeController.js';
   router.get('/endpoint', actionName);
   ```

3. **Registre**: No `src/app.js`
   ```javascript
   import nomeRoutes from './routes/nome.js';
   app.use('/api/nome', nomeRoutes);
   ```

### Adicionando Tradução

1. Edite `src/locales/pt/translation.json`
2. Edite `src/locales/en/translation.json`
3. Use `req.t('chave.da.traducao')` nos controllers

### Mudando Banco de Dados

1. Execute `npm run db:setup:[tipo]`
2. Configure as variáveis específicas no `.env`
3. Execute `npm run db:generate && npm run db:push`

## 📚 Exemplos de Uso

### Criar Usuário

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Accept-Language: pt" \
  -d '{"email": "user@example.com", "senha": "123456"}'
```

### Listar Usuários em Inglês

```bash
curl http://localhost:3000/api/users?lng=en
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
3. Commit: `git commit -m 'Adiciona nova funcionalidade'`
4. Push: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.
