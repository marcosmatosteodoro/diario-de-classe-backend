import { rotaSemQuery } from '../../../src/utilities/rotaSemQuery.js';

describe('rotaSemQuery', () => {
  test('sem query devolve a rota inteira', () => {
    expect(rotaSemQuery({ originalUrl: '/api/alunos' })).toBe('/api/alunos');
  });

  test('com query corta a partir do "?"', () => {
    expect(rotaSemQuery({ originalUrl: '/api/alunos?busca=x&email=y?z' })).toBe('/api/alunos');
  });

  test('sem originalUrl usa url', () => {
    expect(rotaSemQuery({ url: '/api/x?q=1' })).toBe('/api/x');
  });

  test('sem ambos devolve string vazia', () => {
    expect(rotaSemQuery({})).toBe('');
  });
});
