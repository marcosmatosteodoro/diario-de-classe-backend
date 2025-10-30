// Configuração do Prettier com comentários explicativos em português
export default {
  // Adiciona ponto e vírgula no final das declarações
  // true = força ; no final / false = remove ; sempre que possível
  semi: true,

  // Controla vírgulas no final de objetos e arrays
  // "none" = sem vírgulas / "es5" = em arrays/objetos / "all" = onde possível
  trailingComma: 'none',

  // Usa aspas simples ao invés de duplas
  // true = 'texto' / false = "texto"
  singleQuote: true,

  // Largura máxima da linha antes de quebrar (número de caracteres)
  // Recomendado: 80-120 caracteres
  printWidth: 100,

  // Número de espaços por nível de indentação
  // Padrão: 2 espaços para melhor legibilidade
  tabWidth: 2,

  // Usa espaços ao invés de tabs para indentação
  // false = espaços / true = tabs
  // Espaços garantem visualização consistente em todos os editores
  useTabs: false,

  // Adiciona espaços dentro de chaves de objetos
  // true = { foo } / false = {foo}
  bracketSpacing: true,

  // Controla parênteses em arrow functions
  // "avoid" = x => x / "always" = (x) => x
  // "avoid" é mais limpo para parâmetros únicos
  arrowParens: 'avoid',

  // Tipo de quebra de linha
  // "lf" = Unix/Linux/Mac / "crlf" = Windows / "cr" = Mac antigo / "auto" = detecta
  // "lf" é recomendado para compatibilidade multiplataforma
  endOfLine: 'lf',

  // Coloca a chave de abertura na mesma linha
  // false = nova linha / true = mesma linha
  // false melhora legibilidade em JSX
  bracketSameLine: false,

  // Quando adicionar aspas nas propriedades de objetos
  // "as-needed" = só quando necessário / "consistent" = todas iguais / "preserve" = mantém original
  // "as-needed" reduz ruído visual desnecessário
  quoteProps: 'as-needed'
};
