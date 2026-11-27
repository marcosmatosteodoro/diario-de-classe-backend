import { jest } from '@jest/globals';
import Constants from '../../../../src/utilities/constants.js';
import LoggerManager from '../../../../src/utilities/loggerManager.js';
import { DeleteUserController } from '../../../../src/controllers/user/deleteUserController.js';
import { GetUserService } from '../../../../src/services/user/getUserService.js';
import { DeleteUserService } from '../../../../src/services/user/deleteUserService.js';
import { AvaliarContaFixaDemoService } from '../../../../src/services/user/avaliarContaFixaDemoService.js';

const ID = 'cq7k8j2l4m0n5o6p7q8r9s0t1u';
const FIXA = 'fixa@example.com';
const contaFixa = { id: ID, email: FIXA, resetarSenha: false, permissao: 'admin' };

const novoRes = () => ({
  statusCode: null,
  data: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(data) {
    this.data = data;
    return this;
  }
});

const novoReq = () => ({
  validatedId: ID,
  params: { id: ID },
  user: { sub: 'admin-1' },
  t: key => key
});

describe('DeleteUserController no modo demonstração', () => {
  const demoModeOriginal = Constants.demoMode;
  const listaOriginal = Constants.demoContasFixas;
  let getSpy;
  let deleteSpy;
  let warnSpy;

  beforeEach(() => {
    Constants.demoMode = true;
    Constants.demoContasFixas = [FIXA];
    getSpy = jest.spyOn(GetUserService, 'handle').mockResolvedValue({ ...contaFixa });
    deleteSpy = jest.spyOn(DeleteUserService, 'handle').mockResolvedValue(undefined);
    warnSpy = jest.spyOn(LoggerManager, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    Constants.demoMode = demoModeOriginal;
    Constants.demoContasFixas = listaOriginal;
  });

  const executar = async () => {
    const res = novoRes();
    await new DeleteUserController(novoReq(), res).execute();
    return res;
  };

  test('conta fixa: 403, nada excluído e evento com meta exato', async () => {
    const res = await executar();

    expect(res.statusCode).toBe(403);
    expect(res.data).toEqual({ message: 'api.errors.demo_mode_blocked' });
    expect(deleteSpy).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith('demo.acao_recusada', {
      acao: 'excluir_conta_fixa',
      contaSolicitanteId: 'admin-1',
      contaAlvoId: ID
    });
  });

  test('conta comum é excluída com 204', async () => {
    getSpy.mockResolvedValue({ ...contaFixa, email: 'outra@example.com' });

    const res = await executar();

    expect(res.statusCode).toBe(204);
    expect(deleteSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  test('id inexistente mantém 404 e a política não é chamada', async () => {
    getSpy.mockResolvedValue(null);
    const politica = jest.spyOn(AvaliarContaFixaDemoService, 'handle');

    const res = await executar();

    expect(res.statusCode).toBe(404);
    expect(res.data).toEqual({ message: 'users.get.not_found' });
    expect(politica).not.toHaveBeenCalled();
  });

  test('falha do log nega: handleError e service não chamado', async () => {
    const erro = new Error('log falhou');
    warnSpy.mockImplementation(() => {
      throw erro;
    });
    const controller = new DeleteUserController(novoReq(), novoRes());
    controller.handleError = jest.fn();

    await controller.execute();

    expect(controller.handleError).toHaveBeenCalledWith(erro, 'users.delete.error');
    expect(deleteSpy).not.toHaveBeenCalled();
  });

  test('fiação: desligado exclui mesmo com o e-mail na lista; ligado de novo recusa', async () => {
    Constants.demoMode = false;
    const desligado = await executar();
    Constants.demoMode = true;
    const ligado = await executar();

    expect(desligado.statusCode).toBe(204);
    expect(deleteSpy).toHaveBeenCalledTimes(1);
    expect(ligado.statusCode).toBe(403);
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });
});
