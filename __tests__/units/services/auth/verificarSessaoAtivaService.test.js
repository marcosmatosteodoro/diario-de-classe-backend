import { jest } from '@jest/globals';
import { capturarLog } from '../../../mocks/capturaDeLog.js';

// Contadores manuais: o `resetMocks: true` do projeto reseta a implementação de `jest.fn`.
const contagem = { queryRaw: 0, executeRaw: 0 };
let linhas = [];
let falha = null;

jest.unstable_mockModule('../../../../src/db/prisma.js', () => ({
  default: {
    $queryRaw: async () => {
      contagem.queryRaw += 1;
      if (falha) throw falha;
      return linhas;
    },
    $executeRaw: async () => {
      contagem.executeRaw += 1;
      return 0;
    },
    sessaoLogin: {}
  }
}));

const { VerificarSessaoAtivaService } = await import(
  '../../../../src/services/auth/verificarSessaoAtivaService.js'
);
const { default: SessaoLoginRepository } = await import(
  '../../../../src/repositories/sessaoLoginRepository.js'
);
const { default: ServiceUnavailableError } = await import(
  '../../../../src/utilities/errors/serviceUnavailable.js'
);

const DONO = 'dono-da-sessao';
const SENTINELA = 'SENTINELA-SERVICO-503';

const linha = (sobre = {}) => ({
  idUsuario: DONO,
  jtiAtual: 'jti',
  jtiAnterior: null,
  encerrada: false,
  ativa: true,
  dentroDaTolerancia: true,
  expiraEmEpoch: 4102444800,
  restanteSegundos: 3600,
  ...sobre
});

describe('VerificarSessaoAtivaService', () => {
  beforeEach(() => {
    contagem.queryRaw = 0;
    contagem.executeRaw = 0;
    linhas = [];
    falha = null;
  });

  test.each([
    ['sessão ativa do próprio usuário', linha(), DONO, true],
    ['sessão encerrada', linha({ encerrada: true, ativa: false }), DONO, false],
    ['sessão vencida', linha({ ativa: false }), DONO, false],
    ['sessão de outro usuário', linha({ idUsuario: 'outro' }), DONO, false],
    ['sessão inexistente', null, DONO, false]
  ])('%s', async (_nome, estado, idUsuario, esperado) => {
    linhas = estado ? [estado] : [];

    await expect(VerificarSessaoAtivaService.handle('sid-1', idUsuario)).resolves.toBe(esperado);
  });

  test('orçamento: 1 chamada a $queryRaw e 0 a $executeRaw por verificação', async () => {
    linhas = [linha()];

    await VerificarSessaoAtivaService.handle('sid-1', DONO);

    expect(contagem.queryRaw).toBe(1);
    expect(contagem.executeRaw).toBe(0);
  });

  test('chama lerEstado com o sid informado, uma vez', async () => {
    const lerEstado = jest
      .spyOn(SessaoLoginRepository.prototype, 'lerEstado')
      .mockResolvedValue(linha());

    await VerificarSessaoAtivaService.handle('sid-do-teste', DONO);

    expect(lerEstado).toHaveBeenCalledTimes(1);
    expect(lerEstado).toHaveBeenCalledWith('sid-do-teste');
  });

  test('falha do registro: ServiceUnavailableError e log só com name e code', async () => {
    const erro = new Error(`Invalid invocation ${SENTINELA}`);
    erro.name = 'PrismaClientKnownRequestError';
    erro.code = 'P1001';
    falha = erro;
    const log = capturarLog();

    await expect(VerificarSessaoAtivaService.handle('sid-1', DONO)).rejects.toBeInstanceOf(
      ServiceUnavailableError
    );

    expect(log.texto()).toContain('P1001');
    expect(log.texto()).toContain('PrismaClientKnownRequestError');
    expect(log.texto()).not.toContain(SENTINELA);
  });

  test('o erro lançado não carrega a causa nem a mensagem do registro', async () => {
    falha = new Error(SENTINELA);
    capturarLog();

    const erro = await VerificarSessaoAtivaService.handle('sid-1', DONO).catch(e => e);

    expect(erro).toBeInstanceOf(ServiceUnavailableError);
    expect(JSON.stringify(erro)).not.toContain(SENTINELA);
    expect(String(erro.message)).not.toContain(SENTINELA);
  });
});
