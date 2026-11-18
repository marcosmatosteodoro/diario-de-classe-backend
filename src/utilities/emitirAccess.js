import { randomUUID } from 'node:crypto';
import { createJwt } from './createJwt.js';
import Constants from './constants.js';
import { generatePayload } from './generatePayload.js';

/**
 * Emite o JWT de acesso da sessão `sid`, com `jti` próprio (login e renovação usam este caminho).
 * @param {Object} user usuário de origem (`id`, `email`, `permissao`)
 * @param {string} sid identificador da sessão persistida
 * @returns {string} JWT assinado com `Constants.jwtSecret`, vida `Constants.accessExp`
 */
export function emitirAccess(user, sid) {
  return createJwt(
    { ...generatePayload(user), sid, jti: randomUUID() },
    Constants.jwtSecret,
    Constants.accessExp
  );
}
