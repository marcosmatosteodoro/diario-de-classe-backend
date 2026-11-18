import Constants from '../../utilities/constants.js';
import LoggerManager from '../../utilities/loggerManager.js';
import { assertSeedAllowed } from './seedGuard.js';
import { diaCivilSaoPaulo } from './seedCalendario.js';

// Carregar este módulo não grava nem conecta (DEC-004-001 · demonstracao): as etapas, que
// puxam o client do banco, entram por import() dentro de execute(), depois da recusa
// (DEC-004-002 · demonstracao).
export default class Seed {
  constructor({ agora = new Date() } = {}) {
    this.agora = agora;
  }

  /**
   * Recusa produção e senha ausente, grava o catálogo relativo a `agora` e devolve as contagens.
   * @returns {Promise<Record<string, number>>}
   * @throws {Error} recusa do guard, `RangeError` para `agora` inválido ou falha de gravação
   */
  async execute() {
    const senha = assertSeedAllowed();
    const hoje = diaCivilSaoPaulo(this.agora);

    const { executarEtapas } = await import('./seedEtapas.js');
    const quantidades = await executarEtapas({ hoje, senha });

    LoggerManager.info('seed.executado', {
      instante: this.agora.toISOString(),
      ambiente: Constants.env ?? 'desconhecido',
      quantidades
    });

    return quantidades;
  }

  /**
   * @param {{ agora?: Date }} [opcoes] instante de referência; padrão: agora
   * @returns {Promise<Record<string, number>>}
   */
  static async handle({ agora = new Date() } = {}) {
    return new Seed({ agora }).execute();
  }
}
