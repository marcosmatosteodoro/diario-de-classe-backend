// O i18n do app grava o cookie `lng` em toda resposta; o que a sessão controla é o
// subconjunto de set-cookie que não é o de idioma.
export const cookiesDaSessao = res =>
  (res.headers['set-cookie'] ?? []).filter(c => !c.startsWith('lng='));
