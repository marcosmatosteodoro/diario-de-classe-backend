import { jest } from '@jest/globals';
import Constants from '../../../src/utilities/constants.js';
import {
  setSessionCookie,
  clearSessionCookie,
  readSessionCookie
} from '../../../src/utilities/sessionCookie.js';

describe('sessionCookie', () => {
  const original = Constants.isProduction;
  afterEach(() => {
    Constants.isProduction = original;
  });

  const resFalso = () => ({ cookie: jest.fn(), clearCookie: jest.fn() });

  test('setSessionCookie grava com os atributos exatos no ambiente de teste', () => {
    const res = resFalso();
    setSessionCookie(res, 'RT');
    expect(res.cookie).toHaveBeenCalledTimes(1);
    const [nome, valor, opcoes] = res.cookie.mock.calls[0];
    expect(nome).toBe('bls_sessao');
    expect(valor).toBe('RT');
    expect(opcoes.httpOnly).toBe(true);
    expect(opcoes.sameSite).toBe('strict');
    expect(opcoes.secure).toBe(false);
    expect(opcoes.path).toBe('/api/auth');
    expect(opcoes.maxAge).toBe(604800000);
    expect(Object.keys(opcoes).sort()).toEqual([
      'httpOnly',
      'maxAge',
      'path',
      'sameSite',
      'secure'
    ]);
    expect(opcoes).not.toHaveProperty('domain');
  });

  test('setSessionCookie com restante em segundos grava o Max-Age dele e mantém os demais atributos', () => {
    const res = resFalso();
    setSessionCookie(res, 'RT', 500000);
    const opcoes = res.cookie.mock.calls[0][2];
    expect(opcoes.maxAge).toBe(500000 * 1000);
    expect(opcoes.maxAge).not.toBe(Constants.refreshExp * 1000);
    expect([opcoes.httpOnly, opcoes.sameSite, opcoes.path]).toEqual([true, 'strict', '/api/auth']);
  });

  test('setSessionCookie sem o terceiro argumento mantém Max-Age = refreshExp (o login)', () => {
    const res = resFalso();
    setSessionCookie(res, 'RT');
    expect(res.cookie.mock.calls[0][2].maxAge).toBe(Constants.refreshExp * 1000);
  });

  test('setSessionCookie marca secure em produção', () => {
    Constants.isProduction = true;
    const res = resFalso();
    setSessionCookie(res, 'RT');
    expect(res.cookie.mock.calls[0][2].secure).toBe(true);
  });

  test.each([false, true])(
    'clearSessionCookie espelha o escopo da gravação (isProduction=%s)',
    prod => {
      Constants.isProduction = prod;
      const res = resFalso();
      setSessionCookie(res, 'RT');
      clearSessionCookie(res);
      const gravacao = res.cookie.mock.calls[0][2];
      const [nome, remocao] = res.clearCookie.mock.calls[0];
      expect(nome).toBe('bls_sessao');
      for (const campo of ['path', 'sameSite', 'secure', 'httpOnly']) {
        expect(remocao[campo]).toBe(gravacao[campo]);
      }
      expect(remocao).not.toHaveProperty('domain');
    }
  );

  test('readSessionCookie devolve a string não vazia', () => {
    expect(readSessionCookie({ cookies: { bls_sessao: 'abc' } })).toBe('abc');
  });

  test.each([
    ['ausente', { cookies: {} }],
    ['cookies indefinido', {}],
    ['string vazia', { cookies: { bls_sessao: '' } }],
    ['array', { cookies: { bls_sessao: ['a'] } }],
    ['objeto', { cookies: { bls_sessao: { a: 1 } } }],
    ['número', { cookies: { bls_sessao: 7 } }]
  ])('readSessionCookie devolve null para %s', (_, req) => {
    expect(readSessionCookie(req)).toBeNull();
  });
});
