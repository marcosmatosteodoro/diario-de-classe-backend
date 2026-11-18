import Constants from '../../src/utilities/constants.js';

const LINHA_DO_EXEMPLO = /^# DEMO_CONTAS_FIXAS=(.*)$/m;
const TOTAL_DE_CONTAS_FIXAS = 2;

/**
 * Extrai a linha comentada `# DEMO_CONTAS_FIXAS=<lista>` do texto do `.env.example` e a
 * interpreta com o parser real da aplicação (sem normalizar a caixa).
 * @param {string} texto conteúdo do arquivo de exemplo
 * @returns {string[]} e-mails da lista
 * @throws {Error} quando a linha não existe
 */
export function lerContasFixasDoExemplo(texto) {
  const achado = LINHA_DO_EXEMPLO.exec(texto);
  if (!achado) {
    throw new Error('Linha "# DEMO_CONTAS_FIXAS=" ausente do texto de exemplo');
  }
  return Constants.parseDemoContasFixas(achado[1]);
}

/**
 * Confronta a lista do exemplo com os usuários que o seed realmente envia ao
 * `CreateUserService`. Conta fixa é a de e-mail idêntico a um da lista.
 * @param {string[]} contasDoExemplo e-mails da lista
 * @param {Array<{ email: string, permissao: string }>} usuariosEnviados
 * @returns {string[]} divergências; vazia quando a lista e o seed concordam
 */
export function compararContasFixas(contasDoExemplo, usuariosEnviados) {
  const divergencias = [];

  if (contasDoExemplo.length !== TOTAL_DE_CONTAS_FIXAS) {
    divergencias.push(
      `a lista tem ${contasDoExemplo.length} e-mails; esperados ${TOTAL_DE_CONTAS_FIXAS}`
    );
  }

  for (const email of contasDoExemplo) {
    if (!usuariosEnviados.some(usuario => usuario.email === email)) {
      divergencias.push(`e-mail da lista sem correspondente idêntico no seed: ${email}`);
    }
  }

  const admins = usuariosEnviados.filter(usuario => usuario.permissao === 'admin');
  if (admins.length !== 1) {
    divergencias.push(`o seed envia ${admins.length} usuários admin; esperado 1`);
  } else if (!contasDoExemplo.includes(admins[0].email)) {
    divergencias.push(`o admin do seed fora da lista: ${admins[0].email}`);
  }

  const fixas = usuariosEnviados.filter(usuario => contasDoExemplo.includes(usuario.email));
  for (const fixa of fixas) {
    if (fixa.permissao !== 'admin' && fixa.permissao !== 'member') {
      divergencias.push(
        `conta fixa ${fixa.email} com permissao ${fixa.permissao}; esperado member`
      );
    }
  }

  return divergencias;
}
