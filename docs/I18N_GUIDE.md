# 🌍 Internacionalização (i18n) - API Diário de Classe

Esta API suporta múltiplos idiomas usando **i18next**. Português é o idioma padrão.

## 🔧 Configuração

### Idiomas Suportados

- **Português (pt)** - Padrão
- **Inglês (en)**

### Estrutura de Arquivos

```
src/
├── locales/
│   ├── pt/
│   │   └── translation.json    # Traduções em português
│   └── en/
│       └── translation.json    # Traduções em inglês
├── middlewares/
│   └── i18n.js                 # Middleware do i18n
└── utilities/
    └── i18n.js                 # Configuração do i18next
```

## 🚀 Como Usar

### 1. Detectar Idioma Automaticamente

O idioma é detectado automaticamente através de:

#### **Header Accept-Language** (Recomendado)

```bash
curl -H "Accept-Language: en" http://localhost:3000/api/health
curl -H "Accept-Language: pt" http://localhost:3000/api/health
```

#### **Query Parameter**

```bash
curl http://localhost:3000/api/health?lng=en
curl http://localhost:3000/api/health?lng=pt
```

#### **Cookie**

```bash
curl -H "Cookie: lng=en" http://localhost:3000/api/health
```

### 2. Nas Rotas (Backend)

```javascript
// Usar req.t() para traduzir textos
router.get('/exemplo', (req, res) => {
  res.json({
    message: req.t('api.welcome'),
    error: req.t('api.errors.not_found'),
    // Com variáveis
    greeting: req.t('api.greeting', { name: 'João' })
  });
});
```

### 3. Idioma Detectado

```javascript
// Verificar qual idioma foi detectado
router.get('/info', (req, res) => {
  res.json({
    language: req.language, // 'pt' ou 'en'
    languages: req.languages // ['pt', 'en-US', 'en']
  });
});
```

## 📝 Estrutura das Traduções

### Arquivo: `src/locales/pt/translation.json`

```json
{
  "server": {
    "started": "Servidor iniciado na porta {{port}}"
  },
  "api": {
    "welcome": "Bem-vindo à API do Diário de Classe!",
    "health": {
      "status": "OK",
      "message": "API está funcionando corretamente!"
    },
    "errors": {
      "not_found": "Endpoint não encontrado",
      "unauthorized": "Não autorizado"
    }
  },
  "validation": {
    "required": "Campo obrigatório",
    "min_length": "Deve ter pelo menos {{count}} caracteres"
  }
}
```

## 🎯 Exemplos de Uso

### Testando as Rotas

#### Em Português (padrão):

```bash
curl http://localhost:3000/api/health
```

**Resposta:**

```json
{
  "status": "OK",
  "message": "API está funcionando corretamente!",
  "timestamp": "2025-10-30T...",
  "uptime": 123.45,
  "language": "pt"
}
```

#### Em Inglês:

```bash
curl -H "Accept-Language: en" http://localhost:3000/api/health
```

**Resposta:**

```json
{
  "status": "OK",
  "message": "API is working correctly!",
  "timestamp": "2025-10-30T...",
  "uptime": 123.45,
  "language": "en"
}
```

### Com Variáveis (Interpolação)

```javascript
// No arquivo de tradução
{
  "welcome": "Bem-vindo, {{name}}! Você tem {{count}} mensagens"
}

// Na rota
req.t('welcome', { name: 'João', count: 5 })
// Resultado: "Bem-vindo, João! Você tem 5 mensagens"
```

## 🔑 Chaves de Tradução Disponíveis

### **server.**

- `server.started` - Mensagem de servidor iniciado
- `server.error` - Erro no servidor

### **api.**

- `api.welcome` - Mensagem de boas-vindas
- `api.health.status` - Status da API
- `api.health.message` - Mensagem de saúde da API
- `api.errors.not_found` - Endpoint não encontrado
- `api.errors.unauthorized` - Não autorizado
- `api.errors.bad_request` - Requisição inválida
- `api.errors.internal_error` - Erro interno

### **validation.**

- `validation.required` - Campo obrigatório
- `validation.invalid_format` - Formato inválido
- `validation.min_length` - Mínimo de caracteres
- `validation.max_length` - Máximo de caracteres

### **common.**

- `common.success` - Sucesso
- `common.error` - Erro
- `common.save` - Salvar
- `common.cancel` - Cancelar

## ➕ Adicionando Novas Traduções

1. **Adicione a chave em português:**

```json
// src/locales/pt/translation.json
{
  "nova_secao": {
    "nova_chave": "Texto em português"
  }
}
```

2. **Adicione a tradução em inglês:**

```json
// src/locales/en/translation.json
{
  "nova_secao": {
    "nova_chave": "Text in English"
  }
}
```

3. **Use na rota:**

```javascript
router.get('/exemplo', (req, res) => {
  res.json({
    message: req.t('nova_secao.nova_chave')
  });
});
```

## 🛠️ Desenvolvimento

### Debug Mode

No ambiente de desenvolvimento, o i18n mostra logs detalhados. Configure:

```bash
NODE_ENV=development npm run dev
```

### Recarregar Traduções

Em desenvolvimento, as traduções são recarregadas automaticamente quando os arquivos são modificados.

## 🌐 Fallbacks

- **Idioma padrão:** Português (pt)
- **Chave não encontrada:** Retorna a própria chave
- **Middleware indisponível:** Fallbacks hardcoded em português
