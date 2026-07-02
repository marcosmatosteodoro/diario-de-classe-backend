import i18next from 'i18next';
import middleware from 'i18next-http-middleware';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import Constants from '../utilities/constants.js';

// Obter __dirname em ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar traduções diretamente como objetos (mais compatível)
const ptTranslations = JSON.parse(
  readFileSync(path.join(__dirname, '../locales/pt/translation.json'), 'utf8')
);
const enTranslations = JSON.parse(
  readFileSync(path.join(__dirname, '../locales/en/translation.json'), 'utf8')
);

console.log('[i18n] Carregando traduções diretamente do código');

// Configuração do i18next com recursos inline
i18next
  .use(middleware.LanguageDetector) // Plugin para detectar idioma automaticamente
  .init(
    {
      // Idioma padrão (português)
      fallbackLng: 'pt',

      // Idiomas suportados
      supportedLngs: ['pt', 'en'],

      // Carregar idiomas na inicialização
      preload: ['pt', 'en'],

      // Recursos de tradução carregados diretamente
      resources: {
        pt: {
          translation: ptTranslations
        },
        en: {
          translation: enTranslations
        }
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
      contextSeparator: '_'
    },
    (err, t) => {
      if (err) {
        console.error('[i18n] ❌ Erro ao inicializar i18next:', err);
      } else {
        console.log('[i18n] ✅ Inicializado com sucesso -', i18next.language);
        // Testar tradução em desenvolvimento
        if (Constants.env === 'development') {
          console.log('[i18n] Teste PT:', t('auth.login.unauthorized', { lng: 'pt' }));
          console.log('[i18n] Teste EN:', t('auth.login.unauthorized', { lng: 'en' }));
        }
      }
    }
  );

export default i18next;
