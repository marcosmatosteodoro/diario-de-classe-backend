import { jest } from '@jest/globals';
import { randomBytes } from 'node:crypto';

const actual = await import('node:crypto');
// Contador manual: a config do Jest reseta a implementação de jest.fn entre testes.
const scryptMock = { chamadas: 0 };
const scryptContado = (...args) => {
  scryptMock.chamadas += 1;
  return actual.scrypt(...args);
};
jest.unstable_mockModule('node:crypto', () => ({ ...actual, scrypt: scryptContado }));

const { hashSenha, verificarSenha } = await import('../../../src/utilities/password.js');

const BARATO = { N: 2 ** 10, r: 8, p: 1 };
const SALT = randomBytes(16).toString('base64');
const CHAVE = randomBytes(64).toString('base64');
const montar = (n, r, p, salt = SALT, chave = CHAVE) => ['scrypt', n, r, p, salt, chave].join('$');

describe('verificarSenha: hash fora do envelope não chega a derivar', () => {
  beforeEach(() => {
    scryptMock.chamadas = 0;
  });

  test.each([
    ['N=2^20 e r=32 (memória e CPU acima do teto)', montar(2 ** 20, 32, 1)],
    ['N=2^21 r=8 (memória acima do teto)', montar(2 ** 21, 8, 1)],
    ['N e p dentro do teto isolado, mas custo agregado alto', montar(2 ** 17, 8, 4)],
    ['N em hexadecimal', montar('0x400', 8, 1)],
    ['r em notação científica', montar(1024, '8e0', 1)],
    ['N com sinal', montar('+1024', 8, 1)],
    ['chave de 32 bytes', montar(1024, 8, 1, SALT, randomBytes(32).toString('base64'))],
    ['salt de 8 bytes', montar(1024, 8, 1, randomBytes(8).toString('base64'))]
  ])('%s → false sem chamar scrypt', async (_n, gravada) => {
    expect(await verificarSenha('qualquer', gravada)).toBe(false);
    expect(scryptMock.chamadas).toBe(0);
  });

  test('hash válido com N em hexadecimal não autentica a senha correta', async () => {
    const h = await hashSenha('certa', BARATO);
    scryptMock.chamadas = 0;
    const partes = h.split('$');
    partes[1] = '0x400';

    expect(await verificarSenha('certa', partes.join('$'))).toBe(false);
    expect(scryptMock.chamadas).toBe(0);
  });

  test('controle: hash válido deriva e autentica', async () => {
    const h = await hashSenha('certa', BARATO);
    scryptMock.chamadas = 0;

    expect(await verificarSenha('certa', h)).toBe(true);
    expect(scryptMock.chamadas).toBe(1);
  });
});
