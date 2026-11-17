import { describe, test, expect } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import i18nMiddleware from '../../../src/middlewares/i18n.js';

// Pacote i18next-http-middleware real (sem mock): guarda de não-regressão. Não distingue versão: com supportedLngs o ?lng= malicioso já cai no fallback; a versão corrigida se prova pelo lockfile/npm audit.
const CHAVE = 'api.welcome';
const TEXTO_PT = 'Bem-vindo à API do Diário de Classe!';
const TEXTO_EN = 'Welcome to the Class Diary API!';

const app = express();
app.use(i18nMiddleware);
app.get('/t', (req, res) => {
  res.json({ texto: req.t(CHAVE), idioma: req.language });
});

describe('i18nMiddleware com pacote real', () => {
  test.each([
    ['?lng=en', '/t?lng=en', {}, TEXTO_EN, 'en'],
    ['?lng=pt', '/t?lng=pt', {}, TEXTO_PT, 'pt'],
    ['Accept-Language: en sem query', '/t', { 'Accept-Language': 'en' }, TEXTO_EN, 'en'],
    ['idioma fora de supportedLngs (?lng=xx)', '/t?lng=xx', {}, TEXTO_PT, 'pt']
  ])('%s', async (_nome, url, headers, texto, idioma) => {
    const res = await request(app).get(url).set(headers);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ texto, idioma });
    expect(res.headers['content-language']).toBe(idioma);
  });

  test('CR/LF em ?lng= não injeta header nem quebra a resposta', async () => {
    const res = await request(app).get('/t?lng=en%0d%0aSet-Cookie:%20x=y');

    expect(res.status).toBe(200);
    expect(res.headers['content-language']).toBe('pt');
    const cookies = [].concat(res.headers['set-cookie'] || []);
    expect(cookies.some(c => c.includes('x=y'))).toBe(false);
  });
});
