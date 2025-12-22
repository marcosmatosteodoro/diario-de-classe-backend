import express from 'express';
import bodyParser from 'body-parser';
import compress from 'compression';
import methodOverride from 'method-override';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import httpStatus from 'http-status';
import responseTime from 'response-time';
import cookieParser from 'cookie-parser';

import Constants from './utilities/constants.js';
import routes from './routes.js';
import LoggerManager from './utilities/loggerManager.js';
import ErrorHandler from './middlewares/error-handler.js';
import cleanRequest from './middlewares/cleanRequest.js';
import i18nMiddleware from './middlewares/i18n.js';

import { InitialSetting } from './InitialSetting.js';

InitialSetting.handle();

const app = express();

if (!Constants.isProduction) {
  app.use(
    morgan('combined', {
      stream: {
        write: message => {
          LoggerManager.expressLogger(message.substring(0, message.lastIndexOf('\n')));
        }
      }
    })
  );
}

// Middleware de internacionalização - deve vir antes das rotas
app.use(i18nMiddleware);
app.use('/api/stripe', bodyParser.raw({ type: '*/*' })); // Configura endpoint específico do Stripe para receber dados brutos (webhooks)
app.use(responseTime({ header: 'execution-time' })); // Adiciona header com tempo de execução das requisições
app.use(bodyParser.json({ limit: '100mb' })); // Permite parsing de JSON com limite de 100MB
app.use(
  bodyParser.urlencoded({
    extended: true, // Permite parsing de objetos aninhados em form-data
    limit: '100mb' // Define limite de 100MB para dados URL-encoded
  })
);
app.use(compress()); // Habilita compressão gzip/deflate nas respostas
app.use(methodOverride()); // Permite override de métodos HTTP (PUT, DELETE via POST)
app.use(cookieParser()); // Habilita parsing de cookies nas requisições
app.use(helmet()); // Adiciona headers de segurança para proteger a aplicação
app.use(cors()); // Habilita Cross-Origin Resource Sharing (requisições entre domínios)
app.use(cleanRequest); // Middleware customizado para limpeza/sanitização das requisições

// Definir rotas
app.use('/api', routes); // Importa e usa as rotas definidas no arquivo routes.js

// Captura 404 e encaminha para o manipulador de erros
app.use((req, res) => {
  const t = req.t || (key => key); // Fallback se i18n não estiver disponível
  res.status(httpStatus.NOT_FOUND).json({
    error: 'Not Found',
    message: t('api.errors.not_found')
  });
});

// Handle 500
// do not remove next from line bellow, error handle will not work
app.use((err, req, res, _next) => {
  ErrorHandler(err, req, res);
});

export default app;
