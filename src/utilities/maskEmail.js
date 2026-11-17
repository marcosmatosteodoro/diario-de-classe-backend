/**
 * Mascara um e-mail para log: mantém o primeiro caractere do usuário e o domínio.
 * @param {unknown} email
 * @returns {string} ex.: `j***@example.com`; valor não-texto ou vazio → `***`
 */
export function maskEmail(email) {
  if (typeof email !== 'string' || email.length === 0) {
    return '***';
  }
  const at = email.lastIndexOf('@');
  if (at <= 0) {
    return `${email.charAt(0)}***`;
  }
  return `${email.charAt(0)}***${email.slice(at)}`;
}
