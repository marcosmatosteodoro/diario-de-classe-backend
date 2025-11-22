import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import middleware from 'i18next-http-middleware';
import path from 'path';
import { fileURLToPath } from 'url';
import Constants from '../utilities/constants.js';

// Obter __dirname em ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração do i18next
i18next
  .use(Backend) // Plugin para carregar arquivos de tradução
  .use(middleware.LanguageDetector) // Plugin para detectar idioma automaticamente
  .init({
    // Idioma padrão (português)
    fallbackLng: 'pt',

    // Idiomas suportados
    supportedLngs: ['pt', 'en'],

    // Não detectar idioma automaticamente da URL
    preload: ['pt', 'en'],

    // Configuração do backend (arquivos de tradução)
    backend: {
      // Caminho para os arquivos de tradução
      loadPath: path.join(__dirname, '../locales/{{lng}}/{{ns}}.json')
    },

    // Configuração do detector de idioma
    detection: {
      // Ordem de detecção: header Accept-Language -> query string -> cookie -> fallback
      order: ['header', 'querystring', 'cookie'],

      // Parâmetros para detecção
      lookupQuerystring: 'lng', // ?lng=en
      lookupCookie: 'lng', // Cookie: lng=en
      lookupHeader: 'accept-language', // Header: Accept-Language

      // Cache do idioma detectado
      caches: ['cookie'],

      // Não ignorar caso especiais
      ignoreCase: true,

      // Limpar código do idioma (ex: pt-BR -> pt)
      cleanCode: true,

      // Verificar apenas os idiomas suportados
      checkWhitelist: true
    },

    // Interpolação (substituição de variáveis)
    interpolation: {
      // Não escapar HTML (cuidado com XSS!)
      escapeValue: false,

      // Formato das variáveis: {{variavel}}
      prefix: '{{',
      suffix: '}}'
    },

    // Configurações de desenvolvimento
    debug: Constants.env === 'development',

    // Namespace padrão
    defaultNS: 'translation',

    // Recursos de fallback
    ns: ['translation'],

    // Retornar chave se tradução não encontrada (útil para desenvolvimento)
    returnEmptyString: false,
    returnNull: false,

    // Plurais
    pluralSeparator: '_',
    contextSeparator: '_',

    // Recarregar traduções em desenvolvimento
    reloadOnPrerender: Constants.env === 'development'
  });

export default i18next;
