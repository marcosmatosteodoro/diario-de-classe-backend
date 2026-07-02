import { dataAulaKey } from '../../../src/utilities/dataAulaKey.js';

describe('dataAulaKey', () => {
  test('normaliza objeto Date para YYYY-MM-DD (UTC)', () => {
    expect(dataAulaKey(new Date('2025-01-13T00:00:00.000Z'))).toBe('2025-01-13');
  });

  test('normaliza string ISO para YYYY-MM-DD (UTC)', () => {
    expect(dataAulaKey('2025-01-13T00:00:00.000Z')).toBe('2025-01-13');
  });

  test('normaliza string apenas-data', () => {
    expect(dataAulaKey('2025-01-13')).toBe('2025-01-13');
  });

  test('Date e string ISO do mesmo dia geram a mesma chave', () => {
    const key1 = dataAulaKey(new Date('2025-01-13T00:00:00.000Z'));
    const key2 = dataAulaKey('2025-01-13');
    expect(key1).toBe(key2);
  });
});
