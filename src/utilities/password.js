import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);

const PREFIXO = 'scrypt';
const SALT_BYTES = 16;
const KEY_BYTES = 64;

// OWASP Password Storage Cheat Sheet: scrypt com N=2^17, r=8, p=1 é o mínimo recomendado.
export const SCRYPT_PARAMS = Object.freeze({ N: 2 ** 17, r: 8, p: 1 });

// Teto do custo AGREGADO aceito ao ler parâmetros gravados (não por eixo): um valor
// adulterado no banco não força mais memória nem CPU do que o padrão de produção
// já usa (CPU: N·r·p ≤ 2× a do padrão; memória: 128·N·r ≤ 256 MiB). Hoje o teto de
// CPU já implica o de memória; o de memória é a defesa para quando MAX_CUSTO_CPU mudar.
const MAX_MEMORIA_BYTES = 256 * 1024 * 1024;
const MAX_CUSTO_CPU = 2 * SCRYPT_PARAMS.N * SCRYPT_PARAMS.r * SCRYPT_PARAMS.p;
const NUMERO_DECIMAL = /^\d+$/;

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
    r >= 1 &&
    p >= 1 &&
    128 * N * r <= MAX_MEMORIA_BYTES &&
    N * r * p <= MAX_CUSTO_CPU
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
 * @param {{N:number,r:number,p:number}} [params] custo scrypt; padrão SCRYPT_PARAMS
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
 * Compara em tempo constante. Formato inválido, parâmetros fora do teto agregado ou salt/chave de outro tamanho → `false`.
 * @param {string} senha
 * @param {string} gravada hash produzido por `hashSenha`
 * @returns {Promise<boolean>}
 */
export async function verificarSenha(senha, gravada) {
  if (typeof senha !== 'string' || !isHash(gravada)) return false;
  const [, n, r, p, saltB64, hashB64] = gravada.split('$');
  if (![n, r, p].every(v => NUMERO_DECIMAL.test(v))) return false;
  const params = { N: Number(n), r: Number(r), p: Number(p) };
  if (!parametrosValidos(params)) return false;

  const salt = Buffer.from(saltB64, 'base64');
  const esperado = Buffer.from(hashB64, 'base64');
  if (salt.length !== SALT_BYTES || esperado.length !== KEY_BYTES) return false;

  const obtido = await derivar(senha, salt, params);
  return timingSafeEqual(obtido, esperado);
}
