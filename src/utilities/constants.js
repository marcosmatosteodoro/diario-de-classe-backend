import env from 'custom-env';

// Só carrega custom-env em desenvolvimento/test
// Em produção (Vercel), as variáveis vêm do dashboard
if (process.env.NODE_ENV !== 'production') {
  env.env(true);
}

export default class Constants {
  /* Config */
  static env = process.env.NODE_ENV;

  static envCheck = process.env.ENV_CHECK;

  static isProduction = String(Constants.env).toLowerCase().startsWith('prod');

  static serviceName = process.env.NAME;

  static port = process.env.PORT;

  static jwtSecret = process.env.JWT_SECRET_TOKEN || 'dev-secret';

  static jwtRefreshSecret = process.env.JWT_REFRESH_TOKEN || `${Constants.jwtSecret}-refresh`;

  static accessExp = Number(process.env.JWT_EXP_SECONDS) || 60 * 60 * 24 * 7; // 7d

  static refreshExp = Number(process.env.JWT_REFRESH_EXP_SECONDS) || 60 * 60 * 24 * 30; // 30d

  /* Login: limite de tentativas por janela */
  static loginMaxTentativasPorEmail = Number(process.env.LOGIN_MAX_TENTATIVAS_POR_EMAIL) || 5;

  static loginMaxTentativasPorIp = Number(process.env.LOGIN_MAX_TENTATIVAS_POR_IP) || 30;

  static loginJanelaSegundos = Number(process.env.LOGIN_JANELA_SEGUNDOS) || 900; // 15min

  // TRUST_PROXY: número de hops de proxy confiáveis (ex.: 1) ou true/false.
  // Ausente ou em outro formato → undefined e o `trust proxy` do Express não é alterado.
  static trustProxy = Constants.parseTrustProxy(process.env.TRUST_PROXY);

  static parseTrustProxy(value) {
    if (value === undefined || value === null) return undefined;
    const text = String(value).trim().toLowerCase();
    if (text === 'true') return true;
    if (text === 'false') return false;
    if (/^\d+$/.test(text)) return Number(text);
    return undefined;
  }

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
