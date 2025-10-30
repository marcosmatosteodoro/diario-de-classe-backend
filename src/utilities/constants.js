import env from 'custom-env';

env.env(true);

if (process.env.NODE_ENV !== 'test') {
  console.log('Env check: ', process.env.ENV_CHECK);
}

export default class Constants {
  /* Config */
  static env = process.env.NODE_ENV;

  static envCheck = process.env.ENV_CHECK;

  static isProduction = String(Constants.env).toLowerCase().startsWith('prod');

  static serviceName = process.env.NAME;

  static port = process.env.PORT;

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
