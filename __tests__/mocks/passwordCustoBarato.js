// Custo scrypt barato para testes de quem chama hashSenha sem params. Uso (antes dos
// imports dinâmicos do código sob teste):
//   const real = await import('<...>/src/utilities/password.js');
//   jest.unstable_mockModule('<...>/src/utilities/password.js', () => passwordCustoBarato(real));
export const CUSTO_BARATO = Object.freeze({ N: 2 ** 10, r: 8, p: 1 });

export function passwordCustoBarato(real) {
  return {
    ...real,
    SCRYPT_PARAMS: CUSTO_BARATO,
    hashSenha: (senha, params = CUSTO_BARATO) => real.hashSenha(senha, params)
  };
}
