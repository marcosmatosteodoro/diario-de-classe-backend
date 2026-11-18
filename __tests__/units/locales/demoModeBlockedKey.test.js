import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const read = lng =>
  JSON.parse(
    fs.readFileSync(path.join(__dirname, `../../../src/locales/${lng}/translation.json`), 'utf8')
  );

describe('Chave api.errors.demo_mode_blocked', () => {
  test.each(['pt', 'en'])('%s: existe e não é vazia', lng => {
    const value = read(lng).api.errors.demo_mode_blocked;

    expect(typeof value).toBe('string');
    expect(value.length).toBeGreaterThan(0);
  });

  test('pt e en têm textos distintos', () => {
    expect(read('pt').api.errors.demo_mode_blocked).not.toBe(
      read('en').api.errors.demo_mode_blocked
    );
  });

  test('pt menciona demonstração e en menciona demo', () => {
    expect(read('pt').api.errors.demo_mode_blocked).toContain('demonstra');
    expect(read('en').api.errors.demo_mode_blocked).toContain('demo');
  });
});
