import i18next from '../utilities/i18n.js';
import middleware from 'i18next-http-middleware';

// Middleware para adicionar i18n às requisições
const i18nMiddleware = middleware.handle(i18next, {
  // Não remover rotas sem traduções
  removeLngFromUrl: false,

  // Adicionar t() function ao req object
  // Permite usar req.t('chave.da.traducao') nas rotas
  addRequestToReq: true,

  // Adicionar i18n object ao req
  addI18nToReq: true,

  // Headers de resposta com idioma detectado
  setContentLanguage: true
});

export default i18nMiddleware;
