import { URL } from 'node:url';
import env from 'custom-env';

// Só carrega custom-env em desenvolvimento/test
// Em produção (Vercel), as variáveis vêm do dashboard
if (process.env.NODE_ENV !== 'production') {
  env.env(true);
}

export function requireSecret(value, name) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(
      `A variável de ambiente ${name} é obrigatória. Defina-a no ambiente (veja o .env.example).`
    );
  }
  return value;
}

const CORS_ORIGINS_PADRAO_DEV = ['http://localhost:3001'];

function erroCorsOrigins(detalhe) {
  return new Error(`A variável de ambiente CORS_ORIGINS ${detalhe} (veja o .env.example).`);
}

function ehOrigemExata(entrada) {
  try {
    const url = new URL(entrada);
    return ['http:', 'https:'].includes(url.protocol) && url.origin === entrada;
  } catch {
    return false;
  }
}

export function parseCorsOrigins(value, isProduction) {
  const origens = String(value ?? '')
    .split(',')
    .map(item => item.trim())
    .filter(item => item !== '');

  if (origens.length === 0) {
    if (isProduction) {
      throw erroCorsOrigins('é obrigatória em produção. Defina-a no ambiente');
    }
    return [...CORS_ORIGINS_PADRAO_DEV];
  }

  if (!origens.every(ehOrigemExata)) {
    throw erroCorsOrigins(
      'deve conter apenas origens exatas (esquema://host[:porta], sem caminho, barra final ou *)'
    );
  }
  return origens;
}

export default class Constants {
  /* Config */
  static env = process.env.NODE_ENV;

  static envCheck = process.env.ENV_CHECK;

  static isProduction = String(Constants.env).toLowerCase().startsWith('prod');

  static corsOrigins = parseCorsOrigins(process.env.CORS_ORIGINS, Constants.isProduction);

  static serviceName = process.env.NAME;

  static port = process.env.PORT;

  static jwtSecret = requireSecret(process.env.JWT_SECRET_TOKEN, 'JWT_SECRET_TOKEN');

  static jwtRefreshSecret = requireSecret(process.env.JWT_REFRESH_TOKEN, 'JWT_REFRESH_TOKEN');

  static accessExp = Number(process.env.JWT_EXP_SECONDS) || 60 * 60 * 24 * 7; // 7d

  static refreshExp = Number(process.env.JWT_REFRESH_EXP_SECONDS) || 60 * 60 * 24 * 30; // 30d

  /* Database */
  // static database = {
  //   host: process.env.DATABASE_HOST,
  //   name: process.env.DATABASE_NAME,
  //   user: process.env.DATABASE_USER,
  //   password: process.env.DATABASE_PASSWORD,
  //   port: process.env.DATABASE_PORT || 3306,
  // };

  /* Timezone */
  // static tz = process.env.TZ;

  // static jwt = {
  //   secretToken: process.env.JWT_SECRET_TOKEN,
  //   refreshToken: process.env.JWT_REFRESH_TOKEN,
  //   expHours: 1,
  //   expHoursRefresh: 12,
  //   accessTokenKey: 'access_token',
  //   refreshTokenKey: 'refresh_token',
  // };

  // static redis = {
  //   entity: `b2b-${process.env.NODE_ENV}`,
  //   config: {
  //     host: process.env.REDIS_HOST,
  //     port: process.env.REDIS_PORT,
  //     password: process.env.REDIS_PASS,
  //   },
  // };
}
