import { jest } from '@jest/globals';
import Constants from '../../../src/utilities/constants.js';
import LoggerManager from '../../../src/utilities/loggerManager.js';
import bloquearEmModoDemo from '../../../src/middlewares/bloquearEmModoDemo.js';

const ACOES = ['planilha_alunos', 'planilha_conteudos_livro', 'atualizacao_lote_nome_completo'];

const montarRes = () => {
  const res = { status: jest.fn(), json: jest.fn() };
  res.status.mockReturnValue(res);
  return res;
};

const montarReq = () => ({ t: key => key, user: { sub: 'admin-1' } });

describe('bloquearEmModoDemo', () => {
  const demoModeOriginal = Constants.demoMode;
  let warn;

  beforeEach(() => {
    warn = jest.spyOn(LoggerManager, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    Constants.demoMode = demoModeOriginal;
    jest.restoreAllMocks();
  });

  describe.each(ACOES)('acao %s', acao => {
    test('modo desligado: chama next uma vez, não toca res e não registra evento', () => {
      Constants.demoMode = false;
      const res = montarRes();
      const next = jest.fn();

      bloquearEmModoDemo(acao)(montarReq(), res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(warn).not.toHaveBeenCalled();
    });

    test('modo ligado: 403 com a mensagem de demonstração, sem next', () => {
      Constants.demoMode = true;
      const res = montarRes();
      const next = jest.fn();

      bloquearEmModoDemo(acao)(montarReq(), res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'api.errors.demo_mode_blocked' });
      expect(next).not.toHaveBeenCalled();
    });

    test('a flag é lida a cada requisição, nos dois sentidos, com o mesmo middleware', () => {
      const middleware = bloquearEmModoDemo(acao);
      const next = jest.fn();

      Constants.demoMode = false;
      middleware(montarReq(), montarRes(), next);
      Constants.demoMode = true;
      const resLigada = montarRes();
      middleware(montarReq(), resLigada, next);
      Constants.demoMode = false;
      middleware(montarReq(), montarRes(), next);

      expect(next).toHaveBeenCalledTimes(2);
      expect(resLigada.status).toHaveBeenCalledWith(403);
    });
  });

  test.each([
    ['planilha_alunos'],
    ['planilha_conteudos_livro'],
    ['atualizacao_lote_nome_completo']
  ])('modo ligado: um evento demo.acao_recusada com a acao %s', acao => {
    Constants.demoMode = true;

    bloquearEmModoDemo(acao)(montarReq(), montarRes(), jest.fn());

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith('demo.acao_recusada', {
      acao,
      contaSolicitanteId: 'admin-1',
      contaAlvoId: null
    });
  });

  test('fail secure: se o log lança, o erro propaga e a requisição não é liberada', () => {
    Constants.demoMode = true;
    warn.mockImplementation(() => {
      throw new Error('falha de log');
    });
    const res = montarRes();
    const next = jest.fn();

    expect(() => bloquearEmModoDemo('planilha_alunos')(montarReq(), res, next)).toThrow(
      'falha de log'
    );
    expect(next).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});
