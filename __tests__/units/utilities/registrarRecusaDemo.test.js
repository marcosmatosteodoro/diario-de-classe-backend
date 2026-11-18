import { jest } from '@jest/globals';
import LoggerManager from '../../../src/utilities/loggerManager.js';
import { registrarRecusaDemo } from '../../../src/utilities/registrarRecusaDemo.js';
import { capturarLog } from '../../mocks/capturaDeLog.js';

const req = {
  user: { sub: 'sub-1', id: 'id-9', email: 'sentinela@example.com' },
  ip: '203.0.113.7',
  body: { email: 'sentinela@example.com', senha: 'senha-sentinela-1' }
};

afterEach(() => jest.restoreAllMocks());

describe('registrarRecusaDemo', () => {
  test('meta exato: ação, solicitante pelo sub e alvo nulo quando ausente', () => {
    const warn = jest.spyOn(LoggerManager, 'warn').mockImplementation(() => {});

    registrarRecusaDemo(req, { acao: 'planilha_alunos' });

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith('demo.acao_recusada', {
      acao: 'planilha_alunos',
      contaSolicitanteId: 'sub-1',
      contaAlvoId: null
    });
  });

  test('contaAlvoId informado é repassado', () => {
    const warn = jest.spyOn(LoggerManager, 'warn').mockImplementation(() => {});

    registrarRecusaDemo(req, { acao: 'excluir_usuario', contaAlvoId: 'alvo-1' });

    expect(warn).toHaveBeenCalledWith('demo.acao_recusada', {
      acao: 'excluir_usuario',
      contaSolicitanteId: 'sub-1',
      contaAlvoId: 'alvo-1'
    });
  });

  test('sem req.user, contaSolicitanteId é null', () => {
    const warn = jest.spyOn(LoggerManager, 'warn').mockImplementation(() => {});

    registrarRecusaDemo({}, { acao: 'planilha_alunos' });

    expect(warn).toHaveBeenCalledWith('demo.acao_recusada', {
      acao: 'planilha_alunos',
      contaSolicitanteId: null,
      contaAlvoId: null
    });
  });

  test('o log serializado não contém e-mail, senha nem IP', () => {
    const captura = capturarLog();

    registrarRecusaDemo(req, { acao: 'planilha_alunos' });
    const texto = captura.texto();

    expect(texto).toContain('demo.acao_recusada');
    expect(texto).toContain('planilha_alunos');
    expect(texto).not.toContain('sentinela@example.com');
    expect(texto).not.toContain('senha-sentinela-1');
    expect(texto).not.toContain('203.0.113.7');
  });

  test('controle de detecção: a captura enxerga o conteúdo procurado', () => {
    const captura = capturarLog();

    console.warn('controle', { email: 'sentinela@example.com' });

    expect(captura.texto()).toContain('sentinela@example.com');
  });
});
