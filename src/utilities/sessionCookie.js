import Constants from './constants.js';

// Gravação e remoção compartilham os atributos de escopo: o navegador só apaga
// o cookie quando path, sameSite, secure e httpOnly coincidem com os da gravação.
const atributosDeEscopo = () => ({
  httpOnly: true,
  sameSite: 'strict',
  secure: Constants.isProduction,
  path: Constants.sessionCookie.path
});

/**
 * @param {number} [maxAgeSeconds] vida do cookie em segundos; a renovação passa o restante da
 *   sessão (nunca estende), o login usa `Constants.refreshExp`
 */
export function setSessionCookie(res, refreshToken, maxAgeSeconds = Constants.refreshExp) {
  res.cookie(Constants.sessionCookie.name, refreshToken, {
    ...atributosDeEscopo(),
    maxAge: maxAgeSeconds * 1000
  });
}

export function clearSessionCookie(res) {
  res.clearCookie(Constants.sessionCookie.name, atributosDeEscopo());
}

export function readSessionCookie(req) {
  const valor = req?.cookies?.[Constants.sessionCookie.name];
  return typeof valor === 'string' && valor !== '' ? valor : null;
}
