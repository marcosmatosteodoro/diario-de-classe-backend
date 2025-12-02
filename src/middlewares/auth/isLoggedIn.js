import Constants from '../../utilities/constants.js';
import UnauthorizedError from '../../utilities/errors/unauthorized.js';
import crypto from 'crypto';

function parseJwt(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    return { header, payload, signature: parts[2] };
  } catch {
    return null;
  }
}

function verifyJwt(token, secret) {
  const parsed = parseJwt(token);
  if (!parsed) return false;
  const { payload, signature } = parsed;
  const parts = token.split('.');
  const data = `${parts[0]}.${parts[1]}`;
  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('base64')
    .replace(/=+$/, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  if (signature !== expectedSig) return false;
  if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) return false;
  return payload;
}

export default function isLoggedIn(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError());
  }
  const token = authHeader.slice(7);
  const payload = verifyJwt(token, Constants.jwtSecret);
  if (!payload) {
    return next(new UnauthorizedError());
  }
  req.user = payload;
  return next();
}
