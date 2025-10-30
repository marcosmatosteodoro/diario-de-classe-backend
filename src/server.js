import 'newrelic';
// import './db/database';
import app from './app.js';
import Constants from './utilities/constants.js';
// import i18n from './utilities/i18n.js';

app.listen(Constants.port || 3000, () => {
  console.log(`Server started on port ${Constants.port || 3000}`);
});
