import { jest } from '@jest/globals';
import Constants from '../../../../src/utilities/constants.js';
import LoggerManager from '../../../../src/utilities/loggerManager.js';
import { UpdateUserController } from '../../../../src/controllers/user/updateUserController.js';
import { GetUserService } from '../../../../src/services/user/getUserService.js';
import { UpdateUserService } from '../../../../src/services/user/updateUserService.js';
import { IsUserEmailExistsService } from '../../../../src/services/user/isUserEmailExistsService.js';
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

const novoReq = body => ({
  validatedId: ID,
  params: { id: ID },
  user: { sub: 'admin-1' },
  body,
  t: key => key
});

describe('UpdateUserController no modo demonstração', () => {
  const demoModeOriginal = Constants.demoMode;
  const listaOriginal = Constants.demoContasFixas;
  let getSpy;
  let updateSpy;
  let emailSpy;
  let warnSpy;

  beforeEach(() => {
    Constants.demoMode = true;
    Constants.demoContasFixas = [FIXA];
    getSpy = jest.spyOn(GetUserService, 'handle').mockResolvedValue({ ...contaFixa });
    updateSpy = jest.spyOn(UpdateUserService, 'handle').mockResolvedValue({ id: ID });
    emailSpy = jest.spyOn(IsUserEmailExistsService, 'handle').mockResolvedValue(false);
    warnSpy = jest.spyOn(LoggerManager, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    Constants.demoMode = demoModeOriginal;
    Constants.demoContasFixas = listaOriginal;
  });

  const executar = async body => {
    const req = novoReq(body);
    const res = novoRes();
    await new UpdateUserController(req, res).execute();
    return res;
  };

  describe('conta fixa recusada', () => {
    test('senha fornecida: 403, nada aplicado e evento com meta exato', async () => {
      const res = await executar({ senha: 'nova' });

      expect(res.statusCode).toBe(403);
      expect(res.data).toEqual({ message: 'api.errors.demo_mode_blocked' });
      expect(updateSpy).not.toHaveBeenCalled();
      expect(emailSpy).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith('demo.acao_recusada', {
        acao: 'editar_conta_fixa',
        contaSolicitanteId: 'admin-1',
        contaAlvoId: ID
      });
    });

    test('campos permitidos enviados junto não chegam ao service', async () => {
      const res = await executar({ nome: 'Novo', telefone: '11999990000', senha: 'nova' });

      expect(res.statusCode).toBe(403);
      expect(updateSpy).toHaveBeenCalledTimes(0);
    });

    test('e-mail trocado para um já existente: 403 antes do 409', async () => {
      emailSpy.mockResolvedValue(true);

      const res = await executar({ email: 'ocupado@example.com' });

      expect(res.statusCode).toBe(403);
      expect(emailSpy).not.toHaveBeenCalled();
      expect(updateSpy).not.toHaveBeenCalled();
    });
  });

  describe('edição permitida', () => {
    test('conta fixa com campos permitidos e protegidos idênticos chega ao service com o mesmo corpo', async () => {
      const body = {
        nome: 'Novo',
        sobrenome: 'Nome',
        telefone: '11999990000',
        email: FIXA,
        permissao: 'admin',
        resetarSenha: false
      };

      const res = await executar(body);

      expect(res.statusCode).toBe(200);
      expect(updateSpy).toHaveBeenCalledTimes(1);
      expect(updateSpy.mock.calls[0][0]).toBe(ID);
      expect(updateSpy.mock.calls[0][1]).toBe(body);
      expect(warnSpy).not.toHaveBeenCalled();
    });

    test('conta comum com senha, e-mail e permissão diferentes é atualizada', async () => {
      getSpy.mockResolvedValue({ ...contaFixa, email: 'outra@example.com' });

      const res = await executar({ senha: 'nova', email: 'novo@example.com', permissao: 'member' });

      expect(res.statusCode).toBe(200);
      expect(updateSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('duplicidade de e-mail (conta comum)', () => {
    beforeEach(() => {
      getSpy.mockResolvedValue({ ...contaFixa, email: 'a@example.com' });
      emailSpy.mockImplementation(async email => email === FIXA);
    });

    test('mudar para exatamente o e-mail fixo: 409 e service não chamado', async () => {
      const res = await executar({ email: FIXA });

      expect(res.statusCode).toBe(409);
      expect(res.data).toEqual({ message: 'users.create.email_exists' });
      expect(updateSpy).not.toHaveBeenCalled();
    });

    test('variante de caixa é e-mail comum: consulta literal e edição segue', async () => {
      const res = await executar({ email: 'FIXA@example.com' });

      expect(emailSpy).toHaveBeenCalledWith('FIXA@example.com');
      expect(res.statusCode).toBe(200);
      expect(updateSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('falhas', () => {
    test('id inexistente mantém 404 e a política não é chamada', async () => {
      getSpy.mockResolvedValue(null);
      const politica = jest.spyOn(AvaliarContaFixaDemoService, 'handle');

      const res = await executar({ senha: 'nova' });

      expect(res.statusCode).toBe(404);
      expect(res.data).toEqual({ message: 'users.get.not_found' });
      expect(politica).not.toHaveBeenCalled();
    });

    test('falha do log nega: handleError e service não chamado', async () => {
      const erro = new Error('log falhou');
      warnSpy.mockImplementation(() => {
        throw erro;
      });
      const controller = new UpdateUserController(novoReq({ senha: 'nova' }), novoRes());
      controller.handleError = jest.fn();

      await controller.execute();

      expect(controller.handleError).toHaveBeenCalledWith(erro, 'users.update.error');
      expect(updateSpy).not.toHaveBeenCalled();
    });
  });

  describe('fiação com a flag alternada', () => {
    test('desligado, com o e-mail na lista, a senha chega ao service e nada é logado', async () => {
      Constants.demoMode = false;
      const body = { senha: 'nova' };

      const res = await executar(body);

      expect(res.statusCode).toBe(200);
      expect(updateSpy).toHaveBeenCalledTimes(1);
      expect(updateSpy.mock.calls[0][1]).toBe(body);
      expect(warnSpy).not.toHaveBeenCalled();
    });

    test('ligado de novo, a mesma entrada é recusada', async () => {
      Constants.demoMode = false;
      await executar({ senha: 'nova' });
      Constants.demoMode = true;

      const res = await executar({ senha: 'nova' });

      expect(res.statusCode).toBe(403);
      expect(updateSpy).toHaveBeenCalledTimes(1);
    });
  });
});
