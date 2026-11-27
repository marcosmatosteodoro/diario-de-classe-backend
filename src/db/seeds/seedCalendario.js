const FUSO_SEED = 'America/Sao_Paulo';

const DIAS_DA_SEMANA = ['DOMINGO', 'SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO'];

const PADRAO_YMD = /^(\d{4})-(\d{2})-(\d{2})$/;

const MS_POR_DIA = 24 * 60 * 60 * 1000;

function paraUtc(ymd) {
  const partes = PADRAO_YMD.exec(ymd);
  if (!partes) {
    throw new RangeError(`Dia civil inválido: ${ymd}`);
  }
  return Date.UTC(Number(partes[1]), Number(partes[2]) - 1, Number(partes[3]));
}

/**
 * Dia civil de São Paulo (não o dia UTC de toISOString: entre 21h e 24h locais o dia UTC já é
 * o seguinte — DEC-004-003 · demonstracao).
 * @param {Date} instante instante de referência
 * @returns {string} dia civil no formato `YYYY-MM-DD`
 * @throws {RangeError} quando `instante` não é um `Date` válido
 */
export function diaCivilSaoPaulo(instante) {
  if (!(instante instanceof Date) || Number.isNaN(instante.getTime())) {
    throw new RangeError('Instante de referência inválido');
  }

  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: FUSO_SEED,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(instante);

  const valor = tipo => partes.find(parte => parte.type === tipo).value;
  return `${valor('year')}-${valor('month')}-${valor('day')}`;
}

/**
 * Soma `n` dias corridos a um dia civil, sem depender do fuso do processo.
 * @param {string} ymd dia civil `YYYY-MM-DD`
 * @param {number} n dias a somar (negativo subtrai)
 * @returns {string} dia civil resultante `YYYY-MM-DD`
 * @throws {RangeError} quando `ymd` não está no formato `YYYY-MM-DD`
 */
export function somarDias(ymd, n) {
  return new Date(paraUtc(ymd) + n * MS_POR_DIA).toISOString().slice(0, 10);
}

/**
 * Dia da semana de um dia civil, no vocabulário do domínio.
 * @param {string} ymd dia civil `YYYY-MM-DD`
 * @returns {'DOMINGO'|'SEGUNDA'|'TERCA'|'QUARTA'|'QUINTA'|'SEXTA'|'SABADO'} dia da semana
 * @throws {RangeError} quando `ymd` não está no formato `YYYY-MM-DD`
 */
export function diaDaSemana(ymd) {
  return DIAS_DA_SEMANA[new Date(paraUtc(ymd)).getUTCDay()];
}

/**
 * Meia-noite UTC do dia civil: a convenção de dataAula que a aplicação já usa
 * (DEC-004-003 · demonstracao).
 * @param {string} ymd dia civil `YYYY-MM-DD`
 * @returns {Date} meia-noite UTC do dia
 */
export function paraDataAula(ymd) {
  return new Date(`${ymd}T00:00:00.000Z`);
}
