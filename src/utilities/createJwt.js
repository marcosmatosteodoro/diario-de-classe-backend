import crypto from 'crypto';
import { base64url } from './base64url.js';

/**
 * Assina o corpo como JWT HS256 (header fixo, base64url, HMAC-SHA256). Ponto único de assinatura
 * dos tokens emitidos; não acrescenta claims.
 * @param {object} body claims completas
 * @param {string} secret
 * @returns {string}
 */
export function assinarJwt(body, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64url(JSON.stringify(header));
  const encodedBody = base64url(JSON.stringify(body));
  const data = `${encodedHeader}.${encodedBody}`;
  const signature = base64url(
    Buffer.from(crypto.createHmac('sha256', secret).update(data).digest())
  );
  return `${data}.${signature}`;
}

export function createJwt(payload, secret, expiresInSeconds = 3600) {
  const now = Math.floor(Date.now() / 1000);
  return assinarJwt({ ...payload, iat: now, exp: now + expiresInSeconds }, secret);
}
