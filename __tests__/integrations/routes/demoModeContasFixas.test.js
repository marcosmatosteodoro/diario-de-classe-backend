import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import express from 'express';
import request from 'supertest';
import { jest } from '@jest/globals';
import Constants from '../../../src/utilities/constants.js';
import i18nMiddleware from '../../../src/middlewares/i18n.js';
import ErrorHandler from '../../../src/middlewares/error-handler.js';
import routes from '../../../src/routes.js';
import LoggerManager from '../../../src/utilities/loggerManager.js';
import { capturarLog } from '../../mocks/capturaDeLog.js';
import { tokenDe } from '../../mocks/accessDeTeste.js';
import { sessaoAtiva } from '../../mocks/sessaoAtiva.js';
import { GetUserService } from '../../../src/services/user/getUserService.js';
import { UpdateUserService } from '../../../src/services/user/updateUserService.js';
import { DeleteUserService } from '../../../src/services/user/deleteUserService.js';
import { IsUserEmailExistsService } from '../../../src/services/user/isUserEmailExistsService.js';

const ID = 'clh4d6j8h0000kc1j5v3m2n4o';
const FIXA = 'fixa@example.com';
const SENHA = 'senha-sentinela-1';

const traducao = lng =>
  JSON.parse(readFileSync(join(process.cwd(), `src/locales/${lng}/translation.json`), 'utf8')).api
    .errors.demo_mode_blocked;

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use(i18nMiddleware);
  app.use('/', routes);
  app.use((err, req, res, _next) => {
    ErrorHandler(err, req, res);
  });
  return app;
};

const token = () =>
  `Bearer ${tokenDe({ id: 'admin-1', role: 'admin', email: 'admin-secreto@example.com' })}`;

describe('contas fixas nas rotas /professores (router real de src/routes.js)', () => {
  const demoModeOriginal = Constants.demoMode;
  const listaOriginal = Constants.demoContasFixas;
  const app = buildApp();
  let updateSpy;
  let deleteSpy;

  const rotas = {
    DELETE: () => request(app).delete(`/professores/${ID}`),
    PUT: () => request(app).put(`/professores/${ID}`).send({ senha: SENHA, email: FIXA })
  };

  beforeEach(() => {
    sessaoAtiva('admin-1', ID);
    Constants.demoMode = true;
    Constants.demoContasFixas = [FIXA];
    jest
      .spyOn(GetUserService, 'handle')
      .mockResolvedValue({ id: ID, email: FIXA, resetarSenha: false, permissao: 'admin' });
    jest.spyOn(IsUserEmailExistsService, 'handle').mockResolvedValue(false);
    updateSpy = jest.spyOn(UpdateUserService, 'handle').mockResolvedValue({ id: ID });
    deleteSpy = jest.spyOn(DeleteUserService, 'handle').mockResolvedValue(undefined);
  });

  afterEach(() => {
    Constants.demoMode = demoModeOriginal;
    Constants.demoContasFixas = listaOriginal;
  });

  describe.each(Object.keys(rotas))('%s com o modo ligado', metodo => {
    test.each([
      ['en', 'en', () => traducao('en')],
      ['pt (sem Accept-Language)', null, () => traducao('pt')]
    ])('403 no idioma da requisição: %s', async (_nome, lng, esperado) => {
      let req = rotas[metodo]().set('Authorization', token());
      if (lng) req = req.set('Accept-Language', lng);

      const response = await req;

      expect(response.status).toBe(403);
      expect(response.body.message).toBe(esperado());
      expect(traducao('pt')).not.toBe(traducao('en'));
      expect(updateSpy).not.toHaveBeenCalled();
      expect(deleteSpy).not.toHaveBeenCalled();
    });

    test('log leva o evento e nenhum dado pessoal nem a senha', async () => {
      const captura = capturarLog();

      await rotas[metodo]().set('Authorization', token());

      const saida = captura.texto();
      expect(saida).toContain('demo.acao_recusada');
      for (const proibido of ['admin-secreto@example.com', FIXA, SENHA, '127.0.0.1']) {
        expect(saida.includes(proibido)).toBe(false);
      }
    });

    test('evento leva o id interno da conta alvo', async () => {
      const warn = jest.spyOn(LoggerManager, 'warn');

      await rotas[metodo]().set('Authorization', token());

      expect(warn).toHaveBeenCalledWith('demo.acao_recusada', {
        acao: metodo === 'PUT' ? 'editar_conta_fixa' : 'excluir_conta_fixa',
        contaSolicitanteId: 'admin-1',
        contaAlvoId: ID
      });
    });
  });

  test('modo desligado: PUT responde 200 e DELETE 204 pelos dublês', async () => {
    Constants.demoMode = false;

    const put = await rotas.PUT().set('Authorization', token());
    const del = await rotas.DELETE().set('Authorization', token());

    expect(put.status).toBe(200);
    expect(del.status).toBe(204);
    expect(updateSpy).toHaveBeenCalledTimes(1);
    expect(deleteSpy).toHaveBeenCalledTimes(1);
  });

  test('controle de detecção: console.warn com a senha dentro da captura aparece no texto', () => {
    const captura = capturarLog();

    console.warn('x', { senha: SENHA });

    expect(captura.texto()).toContain(SENHA);
  });
});
