import Constants from '../../utilities/constants.js';
import UnauthorizedError from '../../utilities/errors/unauthorized.js';
import { verifyJwt } from '../../utilities/verifyJwt.js';

export default function isLoggedIn(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError());
  }
  const token = authHeader.slice(7);
  const payload = verifyJwt(token, Constants.jwtSecret);
  if (!payload || payload.ver !== Constants.accessTokenVersion) {
    return next(new UnauthorizedError());
  }
  req.user = payload;
  req.user.isAdmin = payload && payload.role === 'admin';
  return next();
}
