import { expect } from '@jest/globals';

// O i18n do app grava o cookie `lng` em toda resposta; o que a sessão controla é o
// subconjunto de set-cookie que não é o de idioma.
export const cookiesDaSessao = res =>
  (res.headers['set-cookie'] ?? []).filter(c => !c.startsWith('lng='));

export const afirmarCookieRemovido = res => {
  const cookies = cookiesDaSessao(res);
  expect(cookies).toHaveLength(1);
  expect(cookies[0].startsWith('bls_sessao=;')).toBe(true);
  expect(cookies[0]).toContain('Path=/api/auth');
  expect(cookies[0]).toContain('HttpOnly');
  expect(cookies[0]).toContain('SameSite=Strict');
  expect(cookies[0]).toMatch(/Expires=Thu, 01 Jan 1970/);
  expect(cookies[0]).not.toContain('Domain');
};

// Invariantes de toda resposta de renovar: o refresh nunca vai no corpo; 200 grava 1 cookie novo,
// 401 remove 1; os demais status não mexem no cookie.
export const afirmarInvariantesDaRenovacao = res => {
  expect(JSON.stringify(res.body)).not.toContain('refreshToken');
  const cookies = cookiesDaSessao(res);
  if (res.status === 200) {
    expect(cookies).toHaveLength(1);
    expect(cookies[0].startsWith('bls_sessao=')).toBe(true);
    expect(cookies[0].startsWith('bls_sessao=;')).toBe(false);
  } else if (res.status === 401) {
    afirmarCookieRemovido(res);
  } else {
    expect(cookies).toEqual([]);
  }
};
