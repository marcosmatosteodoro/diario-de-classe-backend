import crypto from 'crypto';

export function parseJwt(token) {
  if (!token || typeof token !== 'string') return null;
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

export function verifyJwt(token, secret) {
  try {
    if (!secret) return false;
    const parsed = parseJwt(token);
    if (!parsed) return false;
    const { payload, signature } = parsed;
    if (!payload || typeof payload !== 'object') return false;
    const parts = token.split('.');
    const data = `${parts[0]}.${parts[1]}`;
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(data)
      .digest('base64')
      .replace(/=+$/, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
    const received = Buffer.from(signature);
    const expected = Buffer.from(expectedSig);
    if (received.length !== expected.length) return false;
    if (!crypto.timingSafeEqual(received, expected)) return false;
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) return false;
    return payload;
  } catch {
    return false;
  }
}
