import crypto from 'crypto';
import { base64url } from './base64url.js';

export function createJwt(payload, secret, expiresInSeconds = 3600) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + expiresInSeconds };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedBody = base64url(JSON.stringify(body));
  const data = `${encodedHeader}.${encodedBody}`;
  const signature = base64url(
    Buffer.from(crypto.createHmac('sha256', secret).update(data).digest())
  );
  return `${data}.${signature}`;
}
