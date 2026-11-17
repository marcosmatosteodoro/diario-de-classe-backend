import { createHash } from 'node:crypto';

/**
 * Chaves do contador de tentativas de login. O e-mail entra normalizado e em
 * hash, para a tabela não guardar e-mail em claro.
 * @param {string} ip
 * @param {unknown} email
 * @returns {{ chaveIpEmail: string, chaveIp: string }}
 */
export function buildLoginAttemptKeys(ip, email) {
  const normalizado = String(email ?? '')
    .trim()
    .toLowerCase();
  const hash = createHash('sha256').update(normalizado).digest('hex');
  return { chaveIpEmail: `ip-email:${ip}:${hash}`, chaveIp: `ip:${ip}` };
}
