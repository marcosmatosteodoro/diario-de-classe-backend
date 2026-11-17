import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);

const PREFIXO = 'scrypt';
const SALT_BYTES = 16;
const KEY_BYTES = 64;

// OWASP Password Storage Cheat Sheet: scrypt com N=2^17, r=8, p=1 é o mínimo recomendado.
export const SCRYPT_PARAMS = Object.freeze({ N: 2 ** 17, r: 8, p: 1 });

// Teto aceito ao ler parâmetros gravados: um valor adulterado no banco não pode
// forçar alocação ilimitada de memória no servidor.
const MAX_N = 2 ** 20;
const MAX_R = 32;
const MAX_P = 16;

// O scrypt exige maxmem > 128 * N * r; o dobro dá folga para o overhead interno.
function maxmemPara({ N, r }) {
  return 128 * N * r * 2;
}

function derivar(senha, salt, { N, r, p }) {
  return scryptAsync(senha, salt, KEY_BYTES, { N, r, p, maxmem: maxmemPara({ N, r }) });
}

function parametrosValidos({ N, r, p }) {
  return (
    Number.isInteger(N) &&
    Number.isInteger(r) &&
    Number.isInteger(p) &&
    N >= 2 &&
    (N & (N - 1)) === 0 &&
    N <= MAX_N &&
    r >= 1 &&
    r <= MAX_R &&
    p >= 1 &&
    p <= MAX_P
  );
}

/**
 * Formato: `scrypt$N$r$p$<salt base64>$<hash base64>`. Texto puro que por acaso
 * comece com `scrypt$` é indistinguível de um hash — a senha legada é
 * comparada só se `isHash` for falso.
 * @param {*} gravada
 * @returns {boolean}
 */
export function isHash(gravada) {
  if (typeof gravada !== 'string') return false;
  const partes = gravada.split('$');
  return partes.length === 6 && partes[0] === PREFIXO && partes.slice(1).every(p => p !== '');
}

/**
 * @param {string} senha
 * @param {{N:number,r:number,p:number}} [params] custo; só testes passam outro valor
 * @returns {Promise<string>} hash autodescritivo com salt aleatório por senha
 */
export async function hashSenha(senha, params = SCRYPT_PARAMS) {
  if (typeof senha !== 'string' || senha === '') {
    throw new TypeError('senha inválida para hash');
  }
  const salt = randomBytes(SALT_BYTES);
  const derivada = await derivar(senha, salt, params);
  return [
    PREFIXO,
    params.N,
    params.r,
    params.p,
    salt.toString('base64'),
    derivada.toString('base64')
  ].join('$');
}

/**
 * Compara em tempo constante. Formato inválido ou parâmetros fora do teto → `false`.
 * @param {string} senha
 * @param {string} gravada hash produzido por `hashSenha`
 * @returns {Promise<boolean>}
 */
export async function verificarSenha(senha, gravada) {
  if (typeof senha !== 'string' || !isHash(gravada)) return false;
  const [, n, r, p, saltB64, hashB64] = gravada.split('$');
  const params = { N: Number(n), r: Number(r), p: Number(p) };
  if (!parametrosValidos(params)) return false;

  const salt = Buffer.from(saltB64, 'base64');
  const esperado = Buffer.from(hashB64, 'base64');
  if (salt.length === 0 || esperado.length === 0) return false;

  const obtido = await scryptAsync(senha, salt, esperado.length, {
    ...params,
    maxmem: maxmemPara(params)
  });
  return timingSafeEqual(obtido, esperado);
}

/**
 * Comparação em tempo constante de strings; tamanhos diferentes → `false`
 * (usada só para a senha legada em texto puro, durante a transição).
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
export function textoIgualEmTempoConstante(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
