# 📝 Documentação das Regras do Prettier

Este arquivo explica cada configuração do Prettier no arquivo `.prettierrc`.

## 🔧 Configurações de Formatação

### `"semi": true`
**Descrição:** Adiciona ponto e vírgula no final das declarações  
**Opções:**
- `true` - Força `;` no final das linhas
- `false` - Remove `;` sempre que possível  
**Exemplo:**
```javascript
// true
const name = 'João';

// false  
const name = 'João'
```

### `"trailingComma": "none"`
**Descrição:** Controla vírgulas no final de objetos e arrays  
**Opções:**
- `"none"` - Sem vírgulas no final
- `"es5"` - Vírgulas em arrays/objetos (compatível ES5)
- `"all"` - Vírgulas onde possível (ES2017+)  
**Exemplo:**
```javascript
// "none"
const obj = {
  name: 'João',
  age: 30
};

// "es5"
const obj = {
  name: 'João',
  age: 30,
};
```

### `"singleQuote": true`
**Descrição:** Usa aspas simples ao invés de duplas  
**Opções:**
- `true` - Usa aspas simples `'texto'`
- `false` - Usa aspas duplas `"texto"`  
**Exemplo:**
```javascript
// true
const message = 'Olá mundo';

// false
const message = "Olá mundo";
```

### `"printWidth": 100`
**Descrição:** Largura máxima da linha antes de quebrar  
**Valor:** Número de caracteres (padrão: 80)  
**Exemplo:**
```javascript
// Quebra quando passar de 100 caracteres
const longFunction = (param1, param2, param3, param4) => {
  return 'resultado muito longo que será quebrado';
};
```

### `"tabWidth": 2`
**Descrição:** Número de espaços por nível de indentação  
**Valor:** Número de espaços (padrão: 2)  
**Exemplo:**
```javascript
// 2 espaços
if (condition) {
  doSomething();
}

// 4 espaços seria:
if (condition) {
    doSomething();
}
```

### `"useTabs": false`
**Descrição:** Usa espaços ao invés de tabs para indentação  
**Opções:**
- `false` - Usa espaços
- `true` - Usa tabs  
**Benefício:** Espaços garantem visualização consistente em todos os editores

### `"bracketSpacing": true`
**Descrição:** Adiciona espaços dentro de chaves de objetos  
**Opções:**
- `true` - `{ foo: bar }`
- `false` - `{foo: bar}`  
**Exemplo:**
```javascript
// true
const obj = { name: 'João', age: 30 };

// false
const obj = {name: 'João', age: 30};
```

### `"arrowParens": "avoid"`
**Descrição:** Controla parênteses em arrow functions  
**Opções:**
- `"avoid"` - `x => x` (sem parênteses quando possível)
- `"always"` - `(x) => x` (sempre com parênteses)  
**Exemplo:**
```javascript
// "avoid"
const square = x => x * x;
const sum = (a, b) => a + b; // Múltiplos parâmetros precisam de ()

// "always"
const square = (x) => x * x;
```

### `"endOfLine": "lf"`
**Descrição:** Tipo de quebra de linha usado  
**Opções:**
- `"lf"` - Unix/Linux/Mac (Line Feed)
- `"crlf"` - Windows (Carriage Return + Line Feed)
- `"cr"` - Mac antigo (Carriage Return)
- `"auto"` - Detecta automaticamente  
**Recomendação:** Use `"lf"` para compatibilidade multiplataforma

### `"bracketSameLine": false`
**Descrição:** Coloca a chave de abertura na mesma linha  
**Opções:**
- `false` - Chave em nova linha
- `true` - Chave na mesma linha  
**Exemplo:**
```javascript
// false
const Component = () => {
  return (
    <div>
      Conteúdo
    </div>
  );
};

// true
const Component = () => {
  return <div>
    Conteúdo
  </div>;
};
```

### `"quoteProps": "as-needed"`
**Descrição:** Quando adicionar aspas nas propriedades de objetos  
**Opções:**
- `"as-needed"` - Só quando necessário
- `"consistent"` - Consistente (todas ou nenhuma)
- `"preserve"` - Mantém original  
**Exemplo:**
```javascript
// "as-needed"
const obj = {
  name: 'João',        // Sem aspas
  'full-name': 'João'  // Com aspas (necessário pelo hífen)
};

// "consistent"
const obj = {
  'name': 'João',      // Com aspas
  'full-name': 'João'  // Com aspas
};
```

## 🎯 Benefícios da Configuração Atual

- **Legibilidade:** Aspas simples e espaçamento adequado
- **Consistência:** Regras claras para toda a equipe
- **Compatibilidade:** Quebras de linha Unix/Linux
- **Performance:** Sem vírgulas desnecessárias
- **Modernidade:** Sintaxe ES6+ limpa