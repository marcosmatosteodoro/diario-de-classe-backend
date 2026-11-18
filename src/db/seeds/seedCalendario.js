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

// O dia civil sai do fuso de São Paulo, não de toISOString (UTC): entre 21h e 24h locais
// o dia UTC já é o seguinte (DEC-004-003 · demonstracao).
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

export function somarDias(ymd, n) {
  return new Date(paraUtc(ymd) + n * MS_POR_DIA).toISOString().slice(0, 10);
}

export function diaDaSemana(ymd) {
  return DIAS_DA_SEMANA[new Date(paraUtc(ymd)).getUTCDay()];
}

// Meia-noite UTC do dia civil: a convenção de dataAula que a aplicação já usa
// (DEC-004-003 · demonstracao).
export function paraDataAula(ymd) {
  return new Date(`${ymd}T00:00:00.000Z`);
}
