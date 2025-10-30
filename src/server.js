// import 'newrelic'; // Comentado até configurar a license key
// import './db/database';
import app from './app.js';
import Constants from './utilities/constants.js';
import i18n from './utilities/i18n.js';

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
