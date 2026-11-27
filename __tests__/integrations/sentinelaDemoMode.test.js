import { jest } from '@jest/globals';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { setTimeout as esperar } from 'node:timers/promises';
import request from 'supertest';
import Constants from '../../src/utilities/constants.js';
import { cuid, tokenDe } from '../mocks/accessDeTeste.js';
import { sessaoAtiva } from '../mocks/sessaoAtiva.js';
import { planilhaXlsx } from '../mocks/planilhaXlsx.js';
import { registroDeEnvios } from '../mocks/arquivosUpload.js';
import { capturarLog } from '../mocks/capturaDeLog.js';
import { carregarRotasMontadas, TIMEOUT_IMPORT_FRIO } from '../mocks/rotasMontadas.js';

const pt = JSON.parse(readFileSync(join(process.cwd(), 'src/locales/pt/translation.json'), 'utf8'));
const MENSAGEM_DEMO = pt.api.errors.demo_mode_blocked;

const ID = cuid('registro1');
const ID_ADMIN = cuid('admin1');
const FIXA = 'fixa@example.com';
const TOKEN_ADMIN = `Bearer ${tokenDe({ id: ID_ADMIN, role: 'admin' })}`;

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const POR_ROTA = 'guardada-por-rota';
const POR_POLITICA = 'guardada-por-politica';
const PERMITIDA = 'permitida';

// Classificação declarada das rotas sensíveis do modo demonstração (DEC-002-006 · demonstracao):
// rota sensível sem entrada aqui reprova a sentinela.
const CLASSIFICACAO = [
  { verbo: 'POST', caminho: '/api/alunos/upload', classe: POR_ROTA },
  { verbo: 'POST', caminho: '/api/livros/:id/conteudos/upload', classe: POR_ROTA },
  { verbo: 'POST', caminho: '/api/admin/update-nomeCompleto', classe: POR_ROTA },
  { verbo: 'PUT', caminho: '/api/professores/:id', classe: POR_POLITICA },
  { verbo: 'DELETE', caminho: '/api/professores/:id', classe: POR_POLITICA },
  {
    verbo: 'POST',
    caminho: '/api/professores',
    classe: PERMITIDA,
    motivo: 'criar conta de professor não é mudança protegida pelo modo demonstração'
  },
  {
    verbo: 'PUT',
    caminho: '/api/professores/:id/disponibilidade',
    classe: PERMITIDA,
    motivo: 'a disponibilidade do professor não é mudança protegida pelo modo demonstração'
  }
];

const chave = ({ verbo, caminho }) => `${verbo} ${caminho}`;
const urlDe = caminho => caminho.replaceAll(':id', ID);
const MUTADORES = ['POST', 'PUT', 'PATCH', 'DELETE'];

const temMulter = rota => rota.camadas.some(camada => camada.name === 'multerMiddleware');
const sensivelDe = rota =>
  rota.caminho.startsWith('/api/admin') ||
  (rota.caminho.startsWith('/api/professores') && MUTADORES.includes(rota.verbo)) ||
  temMulter(rota);

const sensiveisSemClassificacao = (rotas, classificacao) => {
  const classificadas = new Set(classificacao.map(chave));
  return rotas
    .filter(sensivelDe)
    .map(chave)
    .filter(item => !classificadas.has(item))
    .sort();
};

const daClasse = classe => CLASSIFICACAO.filter(entrada => entrada.classe === classe);

describe('sentinela do modo demonstração sobre as rotas montadas', () => {
  const demoModeOriginal = Constants.demoMode;
  const contasOriginal = Constants.demoContasFixas;
  let app;
  let rotas;

  beforeAll(async () => {
    ({ app, rotas } = await carregarRotasMontadas());
  }, TIMEOUT_IMPORT_FRIO);

  const chamar = (verbo, caminho, corpo = {}) =>
    request(app)[verbo.toLowerCase()](urlDe(caminho)).set('Authorization', TOKEN_ADMIN).send(corpo);

  describe('helper e marca do multer', () => {
    test('enumera exatamente 68 rotas, sem repetição', () => {
      expect(rotas).toHaveLength(68);
      expect(new Set(rotas.map(chave)).size).toBe(68);
    });

    test('as rotas com multerMiddleware são exatamente os 2 uploads', () => {
      expect(rotas.filter(temMulter).map(chave).sort()).toEqual([
        'POST /api/alunos/upload',
        'POST /api/livros/:id/conteudos/upload'
      ]);
    });
  });

  describe('classificação das rotas sensíveis', () => {
    test('as sensíveis enumeradas são 7 e coincidem com as classificadas, nos dois sentidos', () => {
      const sensiveis = rotas.filter(sensivelDe).map(chave).sort();

      expect(sensiveis).toHaveLength(7);
      expect(CLASSIFICACAO).toHaveLength(7);
      expect(sensiveis).toEqual(CLASSIFICACAO.map(chave).sort());
    });

    test('3 guardada-por-rota, 2 guardada-por-politica e 2 permitida com motivo', () => {
      expect(daClasse(POR_ROTA)).toHaveLength(3);
      expect(daClasse(POR_POLITICA).map(chave).sort()).toEqual([
        'DELETE /api/professores/:id',
        'PUT /api/professores/:id'
      ]);
      const permitidas = daClasse(PERMITIDA);
      expect(permitidas.map(chave).sort()).toEqual([
        'POST /api/professores',
        'PUT /api/professores/:id/disponibilidade'
      ]);
      for (const entrada of permitidas) expect(entrada.motivo.length).toBeGreaterThan(0);
    });

    test('com a classificação completa a lista de sem-classificação é vazia (controle)', () => {
      expect(sensiveisSemClassificacao(rotas, CLASSIFICACAO)).toEqual([]);
    });

    test.each(CLASSIFICACAO.map(entrada => [chave(entrada), entrada]))(
      'sem a entrada de %s, ela é a única listada',
      (_nome, removida) => {
        const restante = CLASSIFICACAO.filter(entrada => entrada !== removida);

        expect(sensiveisSemClassificacao(rotas, restante)).toEqual([chave(removida)]);
      }
    );
  });

  describe('com a flag e as rotas da API', () => {
    let AbstractRepository;
    let controllers;

    beforeAll(async () => {
      ({ default: AbstractRepository } = await import(
        '../../src/repositories/abstractRepository.js'
      ));
      const [aluno, conteudo, lote] = await Promise.all([
        import('../../src/controllers/aluno/uploadAlunoExcelController.js'),
        import('../../src/controllers/conteudoLivro/uploadConteudoLivroExcelController.js'),
        import('../../src/controllers/admin/updateNomeCompletoController.js')
      ]);
      controllers = {
        'POST /api/alunos/upload': aluno.UploadAlunoExcelController,
        'POST /api/livros/:id/conteudos/upload': conteudo.UploadConteudoLivroExcelController,
        'POST /api/admin/update-nomeCompleto': lote.UpdateNomeCompletoController
      };
    });

    let GetUserService;
    let UpdateUserService;
    let DeleteUserService;

    beforeAll(async () => {
      ({ GetUserService } = await import('../../src/services/user/getUserService.js'));
      ({ UpdateUserService } = await import('../../src/services/user/updateUserService.js'));
      ({ DeleteUserService } = await import('../../src/services/user/deleteUserService.js'));
    });

    beforeEach(() => {
      capturarLog();
      sessaoAtiva(ID_ADMIN);
      Constants.demoMode = true;
      Constants.demoContasFixas = [FIXA];
      jest.spyOn(AbstractRepository.prototype, 'selectOne').mockResolvedValue({ id: ID });
      jest.spyOn(AbstractRepository.prototype, 'selectMany').mockResolvedValue([]);
      jest.spyOn(AbstractRepository.prototype, 'create').mockResolvedValue({ id: ID });
      jest.spyOn(AbstractRepository.prototype, 'update').mockResolvedValue({ id: ID });
      jest.spyOn(AbstractRepository.prototype, 'delete').mockResolvedValue({ id: ID });
    });

    afterEach(() => {
      Constants.demoMode = demoModeOriginal;
      Constants.demoContasFixas = contasOriginal;
    });

    describe('guardada-por-rota', () => {
      const STATUS_DESLIGADA = {
        'POST /api/alunos/upload': 400,
        'POST /api/livros/:id/conteudos/upload': 400,
        'POST /api/admin/update-nomeCompleto': 200
      };
      const casos = daClasse(POR_ROTA).map(entrada => [chave(entrada), entrada]);
      const envios = registroDeEnvios();

      afterEach(() => envios.limpar());

      // Requisição que atravessa a cadeia real até o execute: upload leva planilha válida anexada.
      const enviarAteOExecute = rota => {
        let req = request(app)
          [rota.verbo.toLowerCase()](urlDe(rota.caminho))
          .set('Authorization', TOKEN_ADMIN);
        if (rota.caminho.endsWith('/upload')) {
          const planilha = envios.registrar(
            planilhaXlsx([['Ana Lima', `${randomUUID()}@example.com`]])
          );
          req = req.attach('file', planilha, { filename: 'planilha.xlsx', contentType: XLSX_MIME });
        }
        return req;
      };
      // `chegou` resolve quando a cadeia alcança o execute: com a guarda quebrada (403 e depois
      // next), o multer ainda lê o corpo depois da resposta, então a ausência só se afirma
      // depois de uma janela em que o execute teria chegado.
      const JANELA_MS = 300;
      const espiarExecute = nome => {
        let chegou;
        const sinal = new Promise(resolve => {
          chegou = resolve;
        });
        const execute = jest
          .spyOn(controllers[nome].prototype, 'execute')
          .mockImplementation(async function () {
            chegou();
            return this.res.headersSent ? undefined : this.res.status(200).json({ ok: true });
          });
        const aguardarJanela = () => Promise.race([sinal, esperar(JANELA_MS)]);
        return { execute, aguardarJanela };
      };

      test.each(casos)(
        '%s com o modo ligado: 403 e o controller não executa',
        async (nome, rota) => {
          const { execute, aguardarJanela } = espiarExecute(nome);

          const res = await enviarAteOExecute(rota);
          await aguardarJanela();

          expect(res.status).toBe(403);
          expect(res.body.message).toBe(MENSAGEM_DEMO);
          expect(execute).not.toHaveBeenCalled();
        }
      );

      test.each(casos)(
        '%s com o modo desligado (controle): a mesma requisição chega ao execute 1 vez',
        async (nome, rota) => {
          Constants.demoMode = false;
          const { execute } = espiarExecute(nome);

          const res = await enviarAteOExecute(rota);

          expect(res.status).toBe(200);
          expect(res.body).toEqual({ ok: true });
          expect(execute).toHaveBeenCalledTimes(1);
        }
      );

      test.each(casos)(
        '%s com o modo desligado (controle): resposta de hoje',
        async (nome, rota) => {
          Constants.demoMode = false;

          const res = await chamar(rota.verbo, rota.caminho);

          expect(res.status).toBe(STATUS_DESLIGADA[nome]);
          expect(res.body.message).not.toBe(MENSAGEM_DEMO);
        }
      );
    });

    describe('guardada-por-politica', () => {
      const CORPO_PUT = { senha: 'senha-nova-1', email: FIXA };
      const rotasPolitica = {
        'PUT /api/professores/:id': () => chamar('PUT', '/api/professores/:id', CORPO_PUT),
        'DELETE /api/professores/:id': () => chamar('DELETE', '/api/professores/:id')
      };

      beforeEach(() => {
        jest
          .spyOn(GetUserService, 'handle')
          .mockResolvedValue({ id: ID, email: FIXA, resetarSenha: false, permissao: 'member' });
      });

      test.each(Object.entries(rotasPolitica))(
        '%s com conta fixa e modo ligado: 403 sem chamar os services de escrita',
        async (_nome, enviar) => {
          const escrita = [
            jest.spyOn(UpdateUserService, 'handle'),
            jest.spyOn(DeleteUserService, 'handle')
          ];

          const res = await enviar();

          expect(res.status).toBe(403);
          expect(res.body.message).toBe(MENSAGEM_DEMO);
          for (const espiao of escrita) expect(espiao).not.toHaveBeenCalled();
        }
      );

      test.each([
        ['PUT /api/professores/:id', 200, () => UpdateUserService],
        ['DELETE /api/professores/:id', 204, () => DeleteUserService]
      ])(
        '%s com o modo desligado (controle): %i e o service de escrita roda 1 vez',
        async (nome, status, service) => {
          Constants.demoMode = false;
          const escrita = jest.spyOn(service(), 'handle');

          const res = await rotasPolitica[nome]();

          expect(res.status).toBe(status);
          expect(escrita).toHaveBeenCalledTimes(1);
        }
      );
    });

    describe('permitida', () => {
      test.each(daClasse(PERMITIDA).map(entrada => [chave(entrada), entrada]))(
        '%s com o modo ligado segue livre: 422 e não a mensagem de demonstração',
        async (_nome, rota) => {
          const res = await chamar(rota.verbo, rota.caminho);

          expect(res.status).toBe(422);
          expect(res.body.message).not.toBe(MENSAGEM_DEMO);
        }
      );
    });
  });
});
