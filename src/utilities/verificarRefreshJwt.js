import Constants from './constants.js';
import { verifyJwt } from './verifyJwt.js';

/**
 * Refresh da sessão válido: assinatura, validade e a claim `typ` emitida no login.
 * Refresh legado (sem a claim) não vale como sessão em cookie.
 * @returns {object|null} payload ou null
 */
export function verificarRefreshJwt(token) {
  const payload = verifyJwt(token, Constants.jwtRefreshSecret);
  if (!payload || payload.typ !== Constants.refreshTokenType) return null;
  return payload;
}
