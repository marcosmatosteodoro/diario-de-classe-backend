# 📚 Diário de Classe - Backend API

Uma API moderna em Node.js com Express para sistema de diário de classe, com suporte completo a internacionalização e múltiplos bancos de dados.

## 🚀 Tecnologias

- **Node.js** com ES Modules
- **Express.js 5.1.0** - Framework web
- **Prisma ORM 6.18.0** - ORM moderno com suporte multi-database
- **i18next** - Internacionalização (Português/Inglês)
- **Jest 29.x** - Framework de testes
- **ESLint + Prettier** - Qualidade e formatação de código
- **Husky** - Git hooks para automação
- **SQLite/PostgreSQL/MySQL** - Suporte flexível a bancos de dados

## 📋 Funcionalidades

- ✅ API RESTful com middleware de segurança
- ✅ Internacionalização completa (PT/EN)
- ✅ ORM com múltiplos bancos de dados
- ✅ Validação de dados
- ✅ Logs estruturados
- ✅ Tratamento de erros centralizado
- ✅ Testes unitários automatizados
- ✅ Git hooks com verificações automáticas
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

# Qualidade de código
npm run lint         # Verificar código
npm run lint:fix     # Corrigir automaticamente
npm run format       # Formatar código
npm run format:check # Verificar formatação

# Testes
npm test            # Executar todos os testes
npm run test:unit   # Executar testes unitários
npm run test:watch  # Executar testes em modo watch
npm run test:coverage # Executar com relatório de cobertura
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
├── locales/             # Traduções
│   ├── pt/translation.json
│   └── en/translation.json
└── __tests__/           # Testes automatizados
    ├── units/           # Testes unitários
    │   └── middlewares/ # Testes dos middlewares
    └── __mocks__/       # Mocks para testes
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

## � Detalhes da API

### Códigos de Status HTTP

A API utiliza os códigos de status HTTP padrão:

- `200` - OK (Sucesso)
- `201` - Created (Recurso criado)
- `400` - Bad Request (Dados inválidos)
- `401` - Unauthorized (Não autorizado)
- `404` - Not Found (Recurso não encontrado)
- `422` - Unprocessable Entity (Erro de validação)
- `500` - Internal Server Error (Erro interno)

### Internacionalização (i18n)

A API suporta múltiplos idiomas através de:

1. **Header Accept-Language**: `Accept-Language: pt-BR` ou `Accept-Language: en-US`
2. **Query Parameter**: `?lng=pt` ou `?lng=en`
3. **Idioma padrão**: Português (pt)

### Tratamento de Erros

Todos os erros retornam um objeto padronizado:

```javascript
{
  "success": false,
  "error": {
    "message": "Mensagem traduzida do erro",
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "field": "email",
        "message": "Email é obrigatório"
      }
    ]
  }
}
```

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

## � Testes

O projeto possui uma suíte completa de testes automatizados:

### Executar Testes

```bash
# Todos os testes
npm test

# Apenas testes unitários
npm run test:unit

# Modo watch (re-executa ao salvar)
npm run test:watch

# Com relatório de cobertura
npm run test:coverage
```

### Estrutura de Testes

- **Unitários**: Testam componentes isolados (middlewares, controllers)
- **Cobertura**: Relatórios detalhados de cobertura de código

## 🔧 CORS e Segurança

### Configuração CORS

Para permitir requisições do frontend, configure as origens permitidas:

```javascript
// Exemplo de configuração para diferentes ambientes
const corsOptions = {
  origin:
    process.env.NODE_ENV === 'production'
      ? ['https://meudominio.com']
      : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
};
```

### Headers de Segurança

A API inclui headers de segurança padrão:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`

## 🌟 Status de Qualidade

```bash
feat: add user authentication
fix: resolve database connection issue
docs: update API documentation
test: add unit tests for user service
```

## 🌐 Comunicação com Frontend

### Headers de Requisição

```javascript
// Definir idioma da resposta
{
  "Accept-Language": "pt-BR" // ou "en-US"
  // ou usar query parameter: ?lng=pt
}

// Para requisições POST/PUT
{
  "Content-Type": "application/json",
  "Accept-Language": "pt"
}
```

### Respostas da API

Todas as respostas seguem o padrão JSON:

```javascript
// Sucesso
{
  "success": true,
  "data": { /* dados */ },
  "message": "Operação realizada com sucesso"
}

// Erro
{
  "success": false,
  "error": {
    "message": "Mensagem do erro",
    "code": "ERROR_CODE",
    "details": []
  }
}
```

### Exemplos de Integração Frontend

#### JavaScript/Fetch

```javascript
// Listar usuários
const response = await fetch('http://localhost:3000/api/users', {
  headers: {
    'Accept-Language': 'pt'
  }
});
const data = await response.json();

// Criar usuário
const newUser = await fetch('http://localhost:3000/api/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept-Language': 'pt'
  },
  body: JSON.stringify({
    email: 'usuario@exemplo.com',
    senha: 'minhasenha123'
  })
});
```

#### React/Axios

```javascript
import axios from 'axios';

// Configurar instância do axios
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Accept-Language': 'pt'
  }
});

// Usar nos componentes
const users = await api.get('/users');
const newUser = await api.post('/users', userData);
```

#### Vue.js

```javascript
// Em um componente Vue
async fetchUsers() {
  try {
    const response = await this.$http.get('/api/users', {
      headers: { 'Accept-Language': this.$i18n.locale }
    });
    this.users = response.data.data;
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
  }
}
```

## 🔧 Configuração para Produção

### Variáveis de Ambiente Essenciais

```bash
NODE_ENV=production
PORT=3000
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
```

### Deploy

```bash
# Instalar dependências
npm ci --production

# Aplicar migrações do banco
npm run db:push

# Iniciar em produção
npm start
```

```

## �🤝 Contribuição

Para contribuir com o projeto, consulte o **[CONTRIBUTING.md](CONTRIBUTING.md)** com diretrizes detalhadas.

**Resumo rápido:**

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
3. Commit seguindo Conventional Commits: `git commit -m 'feat: adiciona nova funcionalidade'`
4. Push: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

**Importante**: Os git hooks executarão automaticamente verificações de qualidade antes dos commits e pushes.

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.
```
