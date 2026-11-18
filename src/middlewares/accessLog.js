import morgan from 'morgan';
import LoggerManager from '../utilities/loggerManager.js';
import { rotaSemQuery } from '../utilities/rotaSemQuery.js';

const stream = {
  write: message => {
    LoggerManager.expressLogger(message.substring(0, message.lastIndexOf('\n')));
  }
};

// Em produção a rota sai sem query string (busca leva nome/e-mail) e sem referrer.
const FORMATO_PRODUCAO =
  ':remote-addr ":method :rota-sem-query" :status :res[content-length] - :response-time ms ":user-agent"';

morgan.token('rota-sem-query', rotaSemQuery);

/**
 * @param {boolean} isProduction
 * @returns {import('express').RequestHandler}
 */
export default function createAccessLog(isProduction) {
  return isProduction ? morgan(FORMATO_PRODUCAO, { stream }) : morgan('combined', { stream });
}
