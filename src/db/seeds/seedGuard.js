import Constants from '../../utilities/constants.js';

/**
 * Recusa o seed em produção e sem `SEED_PASSWORD`; deve rodar antes de qualquer conexão.
 * @throws {Error} quando o ambiente é de produção ou a senha de seed não está definida
 */
export function assertSeedAllowed() {
  if (Constants.isProduction) {
    throw new Error('O seed não pode ser executado em produção.');
  }
  return Constants.seedPassword;
}
