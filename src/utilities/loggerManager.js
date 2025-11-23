import Constants from './constants.js';

export default class LoggerManager {
  static expressLogger(message) {
    console.log(`[EXPRESS] ${new Date().toISOString()} - ${message}`);
  }

  static info(message, meta = {}) {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, meta);
  }

  static error(message, error = null) {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error);
  }

  static warn(message, meta = {}) {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, meta);
  }

  static debug(message, meta = {}) {
    if (Constants.env !== 'production') {
      console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`, meta);
    }
  }
}
