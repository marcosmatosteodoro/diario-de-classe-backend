import {
  hashSenha,
  isHash,
  verificarSenha,
  textoIgualEmTempoConstante,
  SCRYPT_PARAMS
} from '../../../src/utilities/password.js';

describe('password', () => {
  test('custo de produção respeita o mínimo OWASP (N=2^17, r=8, p=1)', () => {
    expect(SCRYPT_PARAMS).toEqual({ N: 131072, r: 8, p: 1 });
  });

  test('duas chamadas com a mesma senha geram strings diferentes e ambas verificam', async () => {
    const [h1, h2] = await Promise.all([hashSenha('x-senha'), hashSenha('x-senha')]);

    expect(h1).not.toBe(h2);
    expect(await verificarSenha('x-senha', h1)).toBe(true);
    expect(await verificarSenha('x-senha', h2)).toBe(true);
  });

  test('formato autodescritivo scrypt$N$r$p$salt$hash e sem a senha em claro', async () => {
    const h = await hashSenha('x-senha');
    const partes = h.split('$');

    expect(partes).toHaveLength(6);
    expect(partes.slice(0, 4)).toEqual(['scrypt', '131072', '8', '1']);
    expect(h).not.toContain('x-senha');
    expect(isHash(h)).toBe(true);
  });

  test('senha errada, vazia e hash como senha → false', async () => {
    const h = await hashSenha('certa');

    expect(await verificarSenha('errada', h)).toBe(false);
    expect(await verificarSenha('', h)).toBe(false);
    expect(await verificarSenha(h, h)).toBe(false);
  });

  test('hashSenha rejeita senha vazia ou não-string', async () => {
    await expect(hashSenha('')).rejects.toThrow(TypeError);
    await expect(hashSenha(undefined)).rejects.toThrow(TypeError);
    await expect(hashSenha(123)).rejects.toThrow(TypeError);
  });

  test.each([
    ['texto puro', 'senha123'],
    ['null', null],
    ['undefined', undefined],
    ['número', 42],
    ['prefixo sem partes', 'scrypt$'],
    ['partes a menos', 'scrypt$131072$8$1$c2FsdA=='],
    ['partes a mais', 'scrypt$131072$8$1$c2FsdA==$aGFzaA==$x'],
    ['algoritmo outro', 'argon2$131072$8$1$c2FsdA==$aGFzaA=='],
    ['parte vazia', 'scrypt$131072$8$1$$aGFzaA==']
  ])('isHash(%s) → false', (_nome, valor) => {
    expect(isHash(valor)).toBe(false);
  });

  test.each([
    ['N não potência de 2', 'scrypt$1000$8$1$c2FsdA==$aGFzaA=='],
    ['N acima do teto', `scrypt$${2 ** 21}$8$1$c2FsdA==$aGFzaA==`],
    ['r zero', 'scrypt$16384$0$1$c2FsdA==$aGFzaA=='],
    ['p acima do teto', 'scrypt$16384$8$99$c2FsdA==$aGFzaA=='],
    ['N não numérico', 'scrypt$abc$8$1$c2FsdA==$aGFzaA==']
  ])('verificarSenha com parâmetros inválidos (%s) → false sem alocar', async (_n, gravada) => {
    expect(isHash(gravada)).toBe(true);
    expect(await verificarSenha('qualquer', gravada)).toBe(false);
  });

  test('hash adulterado (último byte trocado) → false', async () => {
    const h = await hashSenha('certa');
    const partes = h.split('$');
    const buf = Buffer.from(partes[5], 'base64');
    buf[buf.length - 1] ^= 0xff;
    partes[5] = buf.toString('base64');

    expect(await verificarSenha('certa', partes.join('$'))).toBe(false);
  });

  test('textoIgualEmTempoConstante: igual, diferente, tamanhos distintos e não-string', () => {
    expect(textoIgualEmTempoConstante('abc', 'abc')).toBe(true);
    expect(textoIgualEmTempoConstante('abc', 'abd')).toBe(false);
    expect(textoIgualEmTempoConstante('abc', 'abcd')).toBe(false);
    expect(textoIgualEmTempoConstante('abcd', 'abc')).toBe(false);
    expect(textoIgualEmTempoConstante('abc', null)).toBe(false);
    expect(textoIgualEmTempoConstante(undefined, 'abc')).toBe(false);
  });
});
