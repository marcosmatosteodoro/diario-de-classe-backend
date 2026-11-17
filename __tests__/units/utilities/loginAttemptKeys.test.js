import {
  buildLoginAttemptKeys,
  getLoginClientIp
} from '../../../src/utilities/loginAttemptKeys.js';

describe('buildLoginAttemptKeys', () => {
  test('normaliza o e-mail e não o deixa em claro na chave', () => {
    const a = buildLoginAttemptKeys('1.2.3.4', ' Joao@Example.com ');
    const b = buildLoginAttemptKeys('1.2.3.4', 'joao@example.com');

    expect(a).toEqual(b);
    expect(a.chaveIp).toBe('ip:1.2.3.4');
    expect(a.chaveIpEmail).toMatch(/^ip-email:1\.2\.3\.4:[0-9a-f]{64}$/);
    expect(a.chaveIpEmail).not.toContain('joao');
  });

  test('IP ou e-mail diferentes geram chaves diferentes', () => {
    const base = buildLoginAttemptKeys('1.2.3.4', 'a@example.com');

    expect(buildLoginAttemptKeys('1.2.3.5', 'a@example.com').chaveIpEmail).not.toBe(
      base.chaveIpEmail
    );
    expect(buildLoginAttemptKeys('1.2.3.4', 'b@example.com').chaveIpEmail).not.toBe(
      base.chaveIpEmail
    );
  });
});

describe('getLoginClientIp', () => {
  test('usa req.ip e cai em unknown sem IP', () => {
    expect(getLoginClientIp({ ip: '1.2.3.4' })).toBe('1.2.3.4');
    expect(getLoginClientIp({})).toBe('unknown');
  });
});
