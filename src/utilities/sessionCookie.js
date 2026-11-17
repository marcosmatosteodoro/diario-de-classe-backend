import Constants from './constants.js';

// Gravação e remoção compartilham os atributos de escopo: o navegador só apaga
// o cookie quando path, sameSite, secure e httpOnly coincidem com os da gravação.
const atributosDeEscopo = () => ({
  httpOnly: true,
  sameSite: 'strict',
  secure: Constants.isProduction,
  path: Constants.sessionCookie.path
});

export function setSessionCookie(res, refreshToken) {
  res.cookie(Constants.sessionCookie.name, refreshToken, {
    ...atributosDeEscopo(),
    maxAge: Constants.refreshExp * 1000
  });
}

export function clearSessionCookie(res) {
  res.clearCookie(Constants.sessionCookie.name, atributosDeEscopo());
}

export function readSessionCookie(req) {
  const valor = req?.cookies?.[Constants.sessionCookie.name];
  return typeof valor === 'string' && valor !== '' ? valor : null;
}
