import Constants from './constants.js';
import { assinarJwt } from './createJwt.js';

/**
 * Emite o JWT de refresh da sessão `sid`. O `exp` é o instante absoluto da vida da sessão
 * (`expiraEm`), nunca "agora + duração": login e renovação não estendem a vida (DEC-005-016).
 * @param {{ sub: string, sid: string, jti: string, expiraEmEpoch: number }} dados
 * `expiraEmEpoch` em segundos (inteiro)
 * @returns {string} JWT assinado com `Constants.jwtRefreshSecret`
 */
export function emitirRefresh({ sub, sid, jti, expiraEmEpoch }) {
  return assinarJwt(
    {
      sub,
      typ: Constants.refreshTokenType,
      sid,
      jti,
      iat: Math.floor(Date.now() / 1000),
      exp: expiraEmEpoch
    },
    Constants.jwtRefreshSecret
  );
}
