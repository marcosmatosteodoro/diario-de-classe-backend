import Constants from '../../utilities/constants.js';
import UnauthorizedError from '../../utilities/errors/unauthorized.js';
import ServiceUnavailableError from '../../utilities/errors/serviceUnavailable.js';
import { verifyJwt } from '../../utilities/verifyJwt.js';
import { VerificarSessaoAtivaService } from '../../services/auth/verificarSessaoAtivaService.js';

// O sid é um cuid (25 caracteres); o teto só impede que valor enorme do cliente chegue ao banco.
const TAMANHO_MAXIMO_SID = 64;

const sidPlausivel = sid =>
  typeof sid === 'string' && sid.length > 0 && sid.length <= TAMANHO_MAXIMO_SID;

export default async function isLoggedIn(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError());
  }
  const token = authHeader.slice(7);
  const payload = verifyJwt(token, Constants.jwtSecret);
  if (!payload || payload.ver !== Constants.accessTokenVersion || !sidPlausivel(payload.sid)) {
    return next(new UnauthorizedError());
  }

  let ativa;
  try {
    ativa = await VerificarSessaoAtivaService.handle(payload.sid, payload.sub);
  } catch {
    // fail secure: qualquer falha da verificação nega; nunca next() aqui
    return next(new ServiceUnavailableError());
  }
  if (!ativa) {
    return next(new UnauthorizedError());
  }

  req.user = payload;
  req.user.isAdmin = payload.role === 'admin';
  return next();
}
