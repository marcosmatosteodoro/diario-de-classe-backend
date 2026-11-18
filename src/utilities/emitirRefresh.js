import crypto from 'node:crypto';
import Constants from './constants.js';
import { base64url } from './base64url.js';

/**
 * Emite o JWT de refresh da sessão `sid`. O `exp` é o instante absoluto da vida da sessão
 * (`expiraEm`), nunca "agora + duração": login e renovação não estendem a vida (DEC-005-016).
 * @param {{ sub: string, sid: string, jti: string, expiraEmEpoch: number }} dados
 * `expiraEmEpoch` em segundos (inteiro)
 * @returns {string} JWT assinado com `Constants.jwtRefreshSecret`
 */
export function emitirRefresh({ sub, sid, jti, expiraEmEpoch }) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const body = {
    sub,
    typ: Constants.refreshTokenType,
    sid,
    jti,
    iat: Math.floor(Date.now() / 1000),
    exp: expiraEmEpoch
  };
  const data = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(body))}`;
  const signature = base64url(
    Buffer.from(crypto.createHmac('sha256', Constants.jwtRefreshSecret).update(data).digest())
  );
  return `${data}.${signature}`;
}
