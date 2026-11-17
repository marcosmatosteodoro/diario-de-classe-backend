import Constants from './constants.js';

/**
 * Monta o payload de claims do access token (`sub`, `id`, `email`, `role`, `ver`);
 * `isAdmin` é derivado de `role` em `isLoggedIn`.
 * @param {Object} user usuário de origem (`id`, `email`, `permissao`)
 * @returns {{ sub: string, id: string, email: string, role: string, ver: number }} claims do token
 */
export function generatePayload(user) {
  return {
    sub: user.id,
    id: user.id,
    email: user.email,
    role: user.permissao,
    ver: Constants.accessTokenVersion
  };
}
