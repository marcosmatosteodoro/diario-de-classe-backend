import Constants from '../../utilities/constants.js';

const CAMPOS_PROTEGIDOS = ['resetarSenha', 'email', 'permissao'];

// Classe própria, sem AbstractService: o construtor dele exige repositório e a política não acessa banco (DEC-002-004 · demonstracao).
export class AvaliarContaFixaDemoService {
  constructor({ acao, contaAtual, body } = {}) {
    this.acao = acao;
    this.contaAtual = contaAtual;
    this.body = body;
  }

  /**
   * @returns {{ recusar: boolean }}
   */
  execute() {
    // Flag lida a cada chamada e a lista só depois dela: modo desligado ignora a configuração (DEC-002-003 · demonstracao).
    if (!Constants.demoMode) return { recusar: false };

    const lista = Constants.demoContasFixas;
    if (!Array.isArray(lista) || !this.contaAtual) throw new Error('demo.politica_invalida');

    if (!lista.includes(this.contaAtual.email)) return { recusar: false };
    if (this.acao === 'excluir') return { recusar: true };

    return { recusar: this.#editaCampoProtegido() };
  }

  // `undefined` é "não enviado"; `null` enviado difere do gravado e recusa.
  #editaCampoProtegido() {
    const { senha } = this.body;
    if (typeof senha === 'string' && senha.trim() !== '') return true;
    return CAMPOS_PROTEGIDOS.some(
      campo => this.body[campo] !== undefined && this.body[campo] !== this.contaAtual[campo]
    );
  }

  /**
   * Decide se a ação sobre uma conta deve ser recusada no modo demonstração.
   * Compara contra o e-mail gravado (`contaAtual`), nunca contra o payload; qualquer falha interna recusa.
   * @param {Object} params
   * @param {'editar'|'excluir'} params.acao
   * @param {Object} params.contaAtual - conta lida do banco (`email`, `resetarSenha`, `permissao`)
   * @param {Object} [params.body] - corpo da edição
   * @returns {{ recusar: boolean }}
   */
  static handle({ acao, contaAtual, body } = {}) {
    try {
      return new AvaliarContaFixaDemoService({ acao, contaAtual, body: body ?? {} }).execute();
    } catch {
      return { recusar: true };
    }
  }
}
