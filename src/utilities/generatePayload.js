/**
 * Monta o payload de claims do access token (`sub`, `id`, `email`, `role`);
 * `isAdmin` é derivado de `role` em `isLoggedIn`.
 * @param {Object} user usuário de origem (`id`, `email`, `permissao`)
 * @returns {{ sub: string, id: string, email: string, role: string }} claims do token
 */
export function generatePayload(user) {
  return {
    sub: user.id,
    id: user.id,
    email: user.email,
    role: user.permissao
  };
}
