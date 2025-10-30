# 🤝 Guia de Contribuição

## 📋 Índice

- [Configuração do Ambiente](#-configuração-do-ambiente)
- [Fluxo de Desenvolvimento](#-fluxo-de-desenvolvimento)
- [Padrões de Código](#-padrões-de-código)
- [Padrão de Commits](#-padrão-de-commits)
- [Testes](#-testes)
- [Git Hooks](#-git-hooks)

## 🚀 Configuração do Ambiente

### Pré-requisitos

- Node.js >= 18.0.0
- npm >= 9.0.0
- Git

### Instalação

```bash
# 1. Clone o repositório
git clone [url-do-repositorio]
cd diario-de-classe-backend

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env

# 4. Execute as migrações (se houver)
npm run migrate

# 5. Inicie o servidor de desenvolvimento
npm run dev
```

## 🔄 Fluxo de Desenvolvimento

### Branch Strategy

1. **main**: Branch principal de produção
2. **develop**: Branch de desenvolvimento
3. **feature/**: Novas funcionalidades
4. **fix/**: Correções de bugs
5. **hotfix/**: Correções urgentes para produção

### Workflow

```bash
# 1. Crie uma nova branch a partir de develop
git checkout develop
git pull origin develop
git checkout -b feature/nova-funcionalidade

# 2. Desenvolva sua funcionalidade
# ... código ...

# 3. Execute os testes
npm test

# 4. Faça commit seguindo o padrão
git add .
git commit -m "feat: add user authentication"

# 5. Push para o repositório
git push origin feature/nova-funcionalidade

# 6. Abra um Pull Request para develop
```

## 📝 Padrões de Código

### ESLint e Prettier

O projeto utiliza ESLint e Prettier para manter a consistência do código:

```bash
# Verificar problemas de lint
npm run lint

# Corrigir problemas automaticamente
npm run lint:fix

# Formatar código
npm run format

# Verificar formatação
npm run format:check
```

### Estrutura de Arquivos

```
src/
├── controllers/     # Controladores das rotas
├── middlewares/     # Middlewares customizados
├── routes/          # Definição das rotas
├── services/        # Lógica de negócio
├── models/          # Modelos de dados
├── utils/           # Utilitários
└── config/          # Configurações

__tests__/
├── units/           # Testes unitários
├── integration/     # Testes de integração
└── __mocks__/       # Mocks para testes
```

## 📋 Padrão de Commits

Utilizamos **Conventional Commits** para padronizar as mensagens de commit:

### Formato

```
<tipo>[escopo opcional]: <descrição>

[corpo opcional]

[rodapé opcional]
```

### Tipos Válidos

- **feat**: Nova funcionalidade
- **fix**: Correção de bug
- **docs**: Mudanças na documentação
- **style**: Mudanças que não afetam o significado do código
- **refactor**: Refatoração de código
- **perf**: Melhorias de performance
- **test**: Adição ou correção de testes
- **chore**: Mudanças no processo de build ou ferramentas auxiliares
- **ci**: Mudanças nos arquivos de CI
- **build**: Mudanças que afetam o sistema de build
- **revert**: Reverte um commit anterior

### Exemplos

```bash
feat: add user authentication
fix: resolve database connection issue
docs: update API documentation
test: add unit tests for user service
refactor: extract validation logic to separate module
```

## 🧪 Testes

### Estrutura de Testes

- **Unitários**: Testam componentes isolados
- **Integração**: Testam interação entre componentes
- **E2E**: Testam fluxos completos da aplicação

### Comandos

```bash
# Executar todos os testes
npm test

# Executar apenas testes unitários
npm run test:unit

# Executar testes com coverage
npm run test:coverage

# Executar testes em modo watch
npm run test:watch
```

### Convenções

- Arquivos de teste devem ter extensão `.test.js`
- Mocks devem ficar na pasta `__mocks__`
- Cobertura mínima de 80%

## 🪝 Git Hooks

O projeto utiliza **Husky** para automatizar verificações:

### Pre-commit

Executado antes de cada commit:

- ✅ Verificação de lint (ESLint)
- ✅ Verificação de formatação (Prettier)
- ✅ Execução de testes unitários

### Pre-push

Executado antes de cada push:

- ✅ Execução de todos os testes
- ✅ Verificação final de lint

### Commit-msg

Valida se a mensagem do commit segue o padrão Conventional Commits.

### Pulando Hooks (Não Recomendado)

```bash
# Pular pre-commit (apenas em emergências)
git commit --no-verify

# Pular pre-push (apenas em emergências)
git push --no-verify
```

## 🚨 Resolução de Problemas

### Problemas Comuns

#### Erro de Lint

```bash
# Corrigir automaticamente
npm run lint:fix

# Se não funcionar, corrija manualmente seguindo as mensagens
```

#### Erro de Formatação

```bash
# Formatar automaticamente
npm run format
```

#### Testes Falhando

```bash
# Executar em modo verbose para mais detalhes
npm test -- --verbose

# Executar apenas um arquivo específico
npm test -- caminho/para/arquivo.test.js
```

#### Hook Falhando

```bash
# Verificar logs dos hooks
cat .husky/pre-commit
cat .husky/pre-push
cat .husky/commit-msg

# Verificar permissões
ls -la .husky/
```

## 📞 Suporte

Se encontrar problemas ou tiver dúvidas:

1. Consulte a documentação
2. Verifique issues abertas
3. Abra uma nova issue com detalhes do problema
4. Entre em contato com a equipe de desenvolvimento

---

**Lembre-se**: Código limpo, bem testado e bem documentado é responsabilidade de todos! 🎯
