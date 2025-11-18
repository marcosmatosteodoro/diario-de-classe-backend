import { base64url } from '../../../src/utilities/base64url.js';

describe('base64url utility', () => {
  test('encodes simple string correctly', () => {
    const input = 'hello';
    const result = base64url(input);

    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
    // base64 of 'hello' is 'aGVsbG8=' -> without padding and char substitution
    expect(result).toBe('aGVsbG8');
  });

  test('removes padding (=) characters', () => {
    const input = 'a'; // base64 with padding: 'YQ=='
    const result = base64url(input);

    expect(result).not.toContain('=');
  });

  test('replaces + with -', () => {
    // '+' appears in base64 for certain byte sequences
    // example: input with bytes that encode to base64 with '+'
    const input = Buffer.from([0xfb, 0xff]);
    const result = base64url(input);

    expect(result).not.toContain('+');
    expect(result).toContain('-');
  });

  test('replaces / with _', () => {
    // '/' appears in base64 for certain byte sequences
    const input = Buffer.from([0xff, 0xfe]);
    const result = base64url(input);

    expect(result).not.toContain('/');
    expect(result).toContain('_');
  });

  test('handles empty string', () => {
    const input = '';
    const result = base64url(input);

    expect(result).toBe('');
  });

  test('handles unicode/multibyte characters', () => {
    const input = 'café';
    const result = base64url(input);

    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
    expect(result).not.toContain('=');
    expect(result).not.toContain('+');
    expect(result).not.toContain('/');
  });

  test('handles JSON object serialization', () => {
    const obj = { alg: 'HS256', typ: 'JWT' };
    const input = JSON.stringify(obj);
    const result = base64url(input);

    expect(result).toBeDefined();
    expect(result).not.toContain('=');
    expect(result).not.toContain('+');
    expect(result).not.toContain('/');
  });

  test('is idempotent for string input (encoding only, not round-trip)', () => {
    const input = 'test';
    const result1 = base64url(input);
    const result2 = base64url(input);

    expect(result1).toBe(result2);
  });
});
