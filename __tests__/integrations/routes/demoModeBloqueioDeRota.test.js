import { randomUUID } from 'crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import path from 'path';
import express from 'express';
import request from 'supertest';
import { jest } from '@jest/globals';
import Constants from '../../../src/utilities/constants.js';
import i18nMiddleware from '../../../src/middlewares/i18n.js';
import ErrorHandler from '../../../src/middlewares/error-handler.js';
import routes from '../../../src/routes.js';
import LoggerManager from '../../../src/utilities/loggerManager.js';
import AbstractRepository from '../../../src/repositories/abstractRepository.js';
import { uploadDir } from '../../../src/utilities/planilhaUpload.js';
import { planilhaXlsx } from '../../mocks/planilhaXlsx.js';
import { arquivosComConteudo, registroDeEnvios } from '../../mocks/arquivosUpload.js';
import { capturarLog } from '../../mocks/capturaDeLog.js';
import { cuid, tokenDe } from '../../mocks/accessDeTeste.js';
import { sessaoAtiva } from '../../mocks/sessaoAtiva.js';
import { UploadAlunoExcelController } from '../../../src/controllers/aluno/uploadAlunoExcelController.js';
import { UploadConteudoLivroExcelController } from '../../../src/controllers/conteudoLivro/uploadConteudoLivroExcelController.js';
import { UpdateNomeCompletoController } from '../../../src/controllers/admin/updateNomeCompletoController.js';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const ID_LIVRO = cuid('livro1');
const MENSAGEM = 'api.errors.demo_mode_blocked';

const traducao = lng =>
  JSON.parse(readFileSync(join(process.cwd(), `src/locales/${lng}/translation.json`), 'utf8')).api
    .errors.demo_mode_blocked;

const rotas = [
  {
    nome: 'planilha de alunos',
    acao: 'planilha_alunos',
    url: '/alunos/upload',
    controller: UploadAlunoExcelController,
    upload: true
  },
  {
    nome: 'planilha de conteúdos de livro',
    acao: 'planilha_conteudos_livro',
    url: `/livros/${ID_LIVRO}/conteudos/upload`,
    controller: UploadConteudoLivroExcelController,
    upload: true
  },
  {
    nome: 'atualização em lote do nome completo',
    acao: 'atualizacao_lote_nome_completo',
    url: '/admin/update-nomeCompleto',
    controller: UpdateNomeCompletoController,
    upload: false
  }
];
const uploads = rotas.filter(rota => rota.upload);

function buildApp({ i18n = false } = {}) {
  const app = express();
  app.use(express.json());
  if (i18n) {
    app.use(i18nMiddleware);
  } else {
    app.use((req, res, next) => {
      req.t = key => key;
      next();
    });
  }
  app.use('/', routes);
  app.use((err, req, res, _next) => {
    ErrorHandler(err, req, res);
  });
  return app;
}

const tokenAdmin = (extras = {}) =>
  `Bearer ${tokenDe({ id: 'admin-1', role: 'admin', ...extras })}`;

describe('modo demonstração nas rotas de planilha e de lote (router real de src/routes.js)', () => {
  const demoModeOriginal = Constants.demoMode;
  const demoContasFixasOriginal = Constants.demoContasFixas;
  const envios = registroDeEnvios();
  let app;
  let execute;
  let arquivoRecebido;
  let repo;

  beforeEach(() => {
    sessaoAtiva('admin-1', 'prof-1');
    Constants.demoMode = true;
    Constants.demoContasFixas = [];
    app = buildApp();
    arquivoRecebido = undefined;
    execute = {};
    rotas.forEach(rota => {
      execute[rota.acao] = jest
        .spyOn(rota.controller.prototype, 'execute')
        .mockImplementation(async function executeDuble() {
          arquivoRecebido = this.req.file?.path;
          return this.res.status(200).json({ ok: true });
        });
    });
    repo = ['create', 'update', 'delete'].map(metodo =>
      jest.spyOn(AbstractRepository.prototype, metodo).mockResolvedValue(null)
    );
  });

  afterEach(() => {
    envios.limpar();
    Constants.demoMode = demoModeOriginal;
    Constants.demoContasFixas = demoContasFixasOriginal;
    jest.restoreAllMocks();
  });

  const novoConteudo = () =>
    envios.registrar(planilhaXlsx([['Ana Lima', `${randomUUID()}@example.com`]]));

  const enviar = (rota, { token = tokenAdmin(), conteudo, headers = {} } = {}) => {
    let req = request(app).post(rota.url).set(headers);
    if (token) req = req.set('Authorization', token);
    if (rota.upload) {
      req = req.attach('file', conteudo ?? novoConteudo(), {
        filename: 'planilha.xlsx',
        contentType: XLSX_MIME
      });
    }
    return req;
  };

  describe.each(rotas)('$nome com o modo ligado', rota => {
    test('responde 403 com o corpo exato e não chega ao controller nem ao repositório', async () => {
      const response = await enviar(rota);

      expect(response.status).toBe(403);
      expect(response.body).toEqual({ message: MENSAGEM });
      expect(execute[rota.acao]).not.toHaveBeenCalled();
      repo.forEach(spy => expect(spy).not.toHaveBeenCalled());
    });

    test('evento da recusa leva só o meta fechado', async () => {
      const warn = jest.spyOn(LoggerManager, 'warn');

      await enviar(rota);

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith('demo.acao_recusada', {
        acao: rota.acao,
        contaSolicitanteId: 'admin-1',
        contaAlvoId: null
      });
    });

    test('log da recusa não contém o e-mail do token nem o IP da conexão', async () => {
      const captura = capturarLog();

      await enviar(rota, { token: tokenAdmin({ email: 'admin-secreto@example.com' }) });

      const saida = captura.texto();
      expect(saida).toContain('demo.acao_recusada');
      expect(saida.includes('admin-secreto@example.com')).toBe(false);
      expect(saida.includes('127.0.0.1')).toBe(false);
    });

    test('sem Authorization responde 401 e não registra evento', async () => {
      const warn = jest.spyOn(LoggerManager, 'warn');

      const response = await enviar(rota, { token: null });

      expect(response.status).toBe(401);
      expect(warn).not.toHaveBeenCalled();
      expect(execute[rota.acao]).not.toHaveBeenCalled();
    });

    test('professor responde 403 de permissão, sem revelar o modo e sem evento', async () => {
      const warn = jest.spyOn(LoggerManager, 'warn');

      const response = await enviar(rota, {
        token: `Bearer ${tokenDe({ id: 'prof-1', role: 'member' })}`
      });

      expect(response.status).toBe(403);
      expect(response.body).toEqual({ message: 'api.errors.forbidden' });
      expect(warn).not.toHaveBeenCalled();
    });

    test('modo desligado, mesmo com a lista de contas fixas preenchida, chega ao controller', async () => {
      Constants.demoMode = false;
      Constants.demoContasFixas = ['usuario-qualquer@example.com'];

      const response = await enviar(rota);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ ok: true });
      expect(execute[rota.acao]).toHaveBeenCalledTimes(1);
    });

    test.each([
      ['en', { 'Accept-Language': 'en' }, () => traducao('en')],
      ['pt (sem Accept-Language)', {}, () => traducao('pt')]
    ])('mensagem no idioma da requisição: %s', async (_nome, headers, esperado) => {
      app = buildApp({ i18n: true });

      const response = await enviar(rota, { headers });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe(esperado());
      expect(traducao('pt')).not.toBe(traducao('en'));
    });
  });

  describe.each(uploads)('$nome: arquivo em disco', rota => {
    test('modo ligado: nenhum arquivo é gravado no diretório de upload', async () => {
      const conteudo = novoConteudo();

      const response = await enviar(rota, { conteudo });

      expect(response.status).toBe(403);
      expect(arquivosComConteudo(conteudo)).toEqual([]);
    });

    test('controle positivo: modo desligado grava o mesmo envio no uploadDir', async () => {
      Constants.demoMode = false;
      const conteudo = novoConteudo();

      const response = await enviar(rota, { conteudo });

      expect(response.status).toBe(200);
      expect(arquivosComConteudo(conteudo)).toHaveLength(1);
      expect(path.dirname(arquivoRecebido)).toBe(uploadDir);
    });

    test('modo ligado com lista de contas fixas vazia continua recusando', async () => {
      Constants.demoContasFixas = [];

      const response = await enviar(rota);

      expect(response.status).toBe(403);
    });
  });

  test('id de livro inválido segue 400 com o modo ligado, antes da guarda', async () => {
    const warn = jest.spyOn(LoggerManager, 'warn');

    const response = await enviar({ ...rotas[1], url: '/livros/id-invalido/conteudos/upload' });

    expect(response.status).toBe(400);
    expect(warn).not.toHaveBeenCalled();
  });

  test('controle de detecção: console.warn com e-mail dentro da captura aparece no texto', () => {
    const captura = capturarLog();

    console.warn('x', { email: 'admin-secreto@example.com' });

    expect(captura.texto()).toContain('admin-secreto@example.com');
  });
});
