import express from 'express';
import request from 'supertest';
import XLSX from 'xlsx';
import { jest } from '@jest/globals';
import Constants from '../../../src/utilities/constants.js';
import i18nMiddleware from '../../../src/middlewares/i18n.js';
import ErrorHandler from '../../../src/middlewares/error-handler.js';
import routes from '../../../src/routes.js';
import { cuid, tokenDe } from '../../mocks/accessDeTeste.js';
import { sessaoAtiva } from '../../mocks/sessaoAtiva.js';
import { GetAlunoListService } from '../../../src/services/aluno/getAlunoListService.js';
import { GetAlunoService } from '../../../src/services/aluno/getAlunoService.js';
import { GetProjecaoCronogramaService } from '../../../src/services/cronograma/getProjecaoCronogramaService.js';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const ID_ADMIN = cuid('admin1');
const ID_ALUNO = cuid('aluno1');

const PROJECAO = {
  cronograma: { livro: { nome: 'Livro A' } },
  linhas: [
    {
      livroNome: 'Livro A',
      ordem: 1,
      titulo: 'Unidade 1',
      descricao: 'Introdução',
      dataAula: null,
      horaInicial: '10:00',
      horaFinal: '11:00',
      tipo: 'AULA',
      status: 'PENDENTE'
    }
  ],
  conteudosNaoAgendados: [{ ordem: 2, titulo: 'Unidade 2', descricao: null }]
};

const LINHAS_CRONOGRAMA = [
  {
    Livro: 'Livro A',
    Ordem: 1,
    Conteudo: 'Unidade 1',
    Descricao: 'Introdução',
    Data: '',
    Inicio: '10:00',
    Fim: '11:00',
    Tipo: 'AULA',
    Status: 'PENDENTE'
  },
  {
    Livro: 'Livro A',
    Ordem: 2,
    Conteudo: 'Unidade 2',
    Descricao: '',
    Data: '',
    Inicio: '',
    Fim: '',
    Tipo: '',
    Status: 'SEM AULA'
  }
];

const EXPORTACOES = [
  {
    nome: 'GET /api/relatorios/relatorio-1',
    url: '/relatorios/relatorio-1',
    planilha: 'Alunos',
    linhas: [{ id: 'aluno-1', nome: 'Ana' }]
  },
  {
    nome: 'GET /api/alunos/:id/cronograma/excel',
    url: `/alunos/${ID_ALUNO}/cronograma/excel`,
    planilha: 'Cronograma',
    linhas: LINHAS_CRONOGRAMA
  }
];

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

const binario = (res, callback) => {
  const partes = [];
  res.on('data', parte => partes.push(parte));
  res.on('end', () => callback(null, Buffer.concat(partes)));
};

describe('exportação de Excel com o modo demonstração (router real de src/routes.js)', () => {
  const demoModeOriginal = Constants.demoMode;
  const app = buildApp();

  beforeEach(() => {
    sessaoAtiva(ID_ADMIN);
    jest
      .spyOn(GetAlunoListService, 'handle')
      .mockResolvedValue([{ id: 'aluno-1', nome: 'Ana', extra: 'fora da planilha' }]);
    jest.spyOn(GetAlunoService, 'handle').mockResolvedValue({ id: ID_ALUNO, nome: 'Ana' });
    jest.spyOn(GetProjecaoCronogramaService, 'handle').mockResolvedValue(PROJECAO);
  });

  afterEach(() => {
    Constants.demoMode = demoModeOriginal;
  });

  const baixar = async url => {
    const res = await request(app)
      .get(url)
      .set('Authorization', `Bearer ${tokenDe({ id: ID_ADMIN, role: 'admin' })}`)
      .buffer(true)
      .parse(binario);
    const livro = res.status === 200 ? XLSX.read(res.body, { type: 'buffer' }) : null;
    return { res, livro };
  };

  describe.each([true, false])('com demoMode = %s', demoMode => {
    test.each(EXPORTACOES)('$nome: 200, xlsx e planilha com as linhas esperadas', async rota => {
      Constants.demoMode = demoMode;

      const { res, livro } = await baixar(rota.url);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe(XLSX_MIME);
      expect(res.headers['content-disposition']).toMatch(/\.xlsx"?$/);
      expect(livro.SheetNames).toEqual([rota.planilha]);
      expect(XLSX.utils.sheet_to_json(livro.Sheets[rota.planilha])).toEqual(rota.linhas);
    });
  });

  test.each(EXPORTACOES)('$nome: conteúdo com o modo ligado igual ao desligado', async rota => {
    Constants.demoMode = true;
    const ligado = await baixar(rota.url);
    Constants.demoMode = false;
    const desligado = await baixar(rota.url);

    expect(ligado.res.status).toBe(200);
    expect(desligado.res.status).toBe(200);
    expect(XLSX.utils.sheet_to_json(ligado.livro.Sheets[rota.planilha])).toEqual(
      XLSX.utils.sheet_to_json(desligado.livro.Sheets[rota.planilha])
    );
  });
});
