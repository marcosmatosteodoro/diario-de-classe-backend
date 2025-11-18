import { createJwt } from '../../../src/utilities/createJwt.js';
import crypto from 'crypto';
import { base64url } from '../../../src/utilities/base64url.js';

describe('createJwt', () => {
  test('should create a valid JWT with three parts separated by dots', () => {
    const payload = { sub: 'user-1', email: 'test@example.com' };
    const secret = 'test-secret';
    const token = createJwt(payload, secret);

    const parts = token.split('.');
    expect(parts.length).toBe(3);
    expect(typeof parts[0]).toBe('string');
    expect(typeof parts[1]).toBe('string');
    expect(typeof parts[2]).toBe('string');
  });

  test('should include correct header in token', () => {
    const payload = { sub: 'user-1' };
    const secret = 'test-secret';
    const token = createJwt(payload, secret);

    const [encodedHeader] = token.split('.');
    const headerJson = Buffer.from(encodedHeader, 'base64').toString('utf8');
    const header = JSON.parse(headerJson);

    expect(header.alg).toBe('HS256');
    expect(header.typ).toBe('JWT');
  });

  test('should include payload fields in token body', () => {
    const payload = { sub: 'user-1', email: 'test@example.com' };
    const secret = 'test-secret';
    const token = createJwt(payload, secret);

    const [, encodedBody] = token.split('.');
    const bodyJson = Buffer.from(encodedBody, 'base64').toString('utf8');
    const body = JSON.parse(bodyJson);

    expect(body.sub).toBe('user-1');
    expect(body.email).toBe('test@example.com');
  });

  test('should include iat and exp in token body', () => {
    const payload = { sub: 'user-1' };
    const secret = 'test-secret';
    const before = Math.floor(Date.now() / 1000);
    const token = createJwt(payload, secret, 3600);
    const after = Math.floor(Date.now() / 1000);

    const [, encodedBody] = token.split('.');
    const bodyJson = Buffer.from(encodedBody, 'base64').toString('utf8');
    const body = JSON.parse(bodyJson);

    expect(typeof body.iat).toBe('number');
    expect(typeof body.exp).toBe('number');
    expect(body.iat).toBeGreaterThanOrEqual(before);
    expect(body.iat).toBeLessThanOrEqual(after);
    expect(body.exp).toBe(body.iat + 3600);
  });

  test('should generate correct HMAC signature', () => {
    const payload = { sub: 'user-1' };
    const secret = 'test-secret';
    const token = createJwt(payload, secret, 3600);

    const [encodedHeader, encodedBody, encodedSignature] = token.split('.');
    const data = `${encodedHeader}.${encodedBody}`;

    // Recompute signature manually
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(data);
    const expectedSignature = base64url(Buffer.from(hmac.digest()));

    expect(encodedSignature).toBe(expectedSignature);
  });

  test('should respect custom expiration time', () => {
    const payload = { sub: 'user-1' };
    const secret = 'test-secret';
    const customExp = 7200; // 2 hours
    const token = createJwt(payload, secret, customExp);

    const [, encodedBody] = token.split('.');
    const bodyJson = Buffer.from(encodedBody, 'base64').toString('utf8');
    const body = JSON.parse(bodyJson);

    expect(body.exp).toBe(body.iat + customExp);
  });

  test('should produce different tokens for different secrets', () => {
    const payload = { sub: 'user-1' };
    const token1 = createJwt(payload, 'secret-1');
    const token2 = createJwt(payload, 'secret-2');

    expect(token1).not.toBe(token2);
  });

  test('should produce same token structure for same input and timestamp', () => {
    const payload = { sub: 'user-1' };
    const secret = 'test-secret';
    const now = Math.floor(Date.now() / 1000);

    // Mock Date.now to ensure consistency
    const originalNow = Date.now;
    Date.now = () => now * 1000;

    try {
      const token1 = createJwt(payload, secret, 3600);
      const token2 = createJwt(payload, secret, 3600);
      expect(token1).toBe(token2);
    } finally {
      Date.now = originalNow;
    }
  });

  test('should handle empty payload', () => {
    const payload = {};
    const secret = 'test-secret';
    const token = createJwt(payload, secret);

    const parts = token.split('.');
    expect(parts.length).toBe(3);

    const [, encodedBody] = parts;
    const bodyJson = Buffer.from(encodedBody, 'base64').toString('utf8');
    const body = JSON.parse(bodyJson);

    expect(body.iat).toBeDefined();
    expect(body.exp).toBeDefined();
  });
});
