import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const read = lng =>
  JSON.parse(
    fs.readFileSync(path.join(__dirname, `../../../src/locales/${lng}/translation.json`), 'utf8')
  );

describe('Chave api.errors.payload_too_large', () => {
  test.each(['pt', 'en'])('%s: existe e não é vazia', lng => {
    const value = read(lng).api.errors.payload_too_large;

    expect(typeof value).toBe('string');
    expect(value.length).toBeGreaterThan(0);
  });

  test('pt e en têm textos distintos', () => {
    expect(read('pt').api.errors.payload_too_large).not.toBe(
      read('en').api.errors.payload_too_large
    );
  });
});
