// import 'newrelic'; // Comentado até configurar a license key
// import './db/database';
import app from './app.js';
import Constants from './utilities/constants.js';
import i18n from './utilities/i18n-inline.js';

console.log('Environment Check:', {
  NODE_ENV: process.env.NODE_ENV,
  HAS_DATABASE_URL: !!process.env.DATABASE_URL,
  HAS_JWT_SECRET: !!process.env.JWT_SECRET_TOKEN
});

console.log('Constants check:', {
  env: Constants.env,
  envCheck: Constants.envCheck,
  isProduction: Constants.isProduction,
  serviceName: Constants.serviceName,
  port: Constants.port,
  jwtSecret: Constants.jwtSecret,
  jwtRefreshSecret: Constants.jwtRefreshSecret,
  accessExp: Constants.accessExp,
  refreshExp: Constants.refreshExp
});

// Aguardar inicialização do i18n antes de iniciar o servidor
i18n.on('initialized', () => {
  app.listen(Constants.port || 3000, () => {
    console.log(i18n.t('server.started', { port: Constants.port || 3000 }));
  });
});

// Fallback caso o i18n já esteja inicializado
if (i18n.isInitialized) {
  app.listen(Constants.port || 3000, () => {
    console.log(i18n.t('server.started', { port: Constants.port || 3000 }));
  });
}
