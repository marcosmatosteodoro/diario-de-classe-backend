import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import createAccessLog from '../../../src/middlewares/accessLog.js';
import LoggerManager from '../../../src/utilities/loggerManager.js';

describe('accessLog', () => {
  let linhas;

  beforeEach(() => {
    linhas = [];
    jest.spyOn(LoggerManager, 'expressLogger').mockImplementation(m => linhas.push(m));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const requisitar = async isProduction => {
    const app = express();
    app.use(createAccessLog(isProduction));
    app.get('/api/alunos', (req, res) => res.status(200).send('ok'));
    await request(app)
      .get('/api/alunos?busca=termo-sentinela&email=ana@example.com')
      .set('Referer', 'https://ref.example.com/pagina')
      .set('User-Agent', 'agente-teste');
    // morgan escreve ao fim da resposta; cede um turno para a escrita assentar.
    await new Promise(resolve => process.nextTick(resolve));
    return linhas;
  };

  test('produção: ip, método, rota sem query, status, bytes e user-agent; sem referrer', async () => {
    await requisitar(true);

    expect(linhas).toHaveLength(1);
    expect(linhas[0]).toMatch(/^\S+ "GET \/api\/alunos" 200 2 - [\d.]+ ms "agente-teste"$/);
    expect(linhas[0]).not.toContain('termo-sentinela');
    expect(linhas[0]).not.toContain('ana@example.com');
    expect(linhas[0]).not.toContain('ref.example.com');
  });

  test('fora de produção: formato combined, com query e referrer', async () => {
    await requisitar(false);

    expect(linhas).toHaveLength(1);
    expect(linhas[0]).toContain(
      '"GET /api/alunos?busca=termo-sentinela&email=ana@example.com HTTP/1.1" 200 2 "https://ref.example.com/pagina" "agente-teste"'
    );
  });
});
