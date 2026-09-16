import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const readTranslation = lng =>
  JSON.parse(
    fs.readFileSync(path.join(__dirname, `../../../src/locales/${lng}/translation.json`), 'utf8')
  );

const ptTranslation = readTranslation('pt');
const enTranslation = readTranslation('en');

/**
 * BI-38: validateSearchQuery.js chama req.t('validation.search.tooLong') e
 * req.t('validation.search.invalidType'), mas essas chaves não existiam nos
 * arquivos de tradução — i18next devolvia a chave crua em vez do texto.
 */
describe('Chaves de tradução de validation.search (BI-38)', () => {
  test.each([
    ['pt', ptTranslation],
    ['en', enTranslation]
  ])(
    '%s: validation.search.tooLong e invalidType existem e não são a chave crua',
    (lng, translation) => {
      const search = translation.validation && translation.validation.search;

      expect(search).toBeDefined();
      expect(typeof search.tooLong).toBe('string');
      expect(search.tooLong.length).toBeGreaterThan(0);
      expect(search.tooLong).not.toBe('validation.search.tooLong');

      expect(typeof search.invalidType).toBe('string');
      expect(search.invalidType.length).toBeGreaterThan(0);
      expect(search.invalidType).not.toBe('validation.search.invalidType');
    }
  );
});
