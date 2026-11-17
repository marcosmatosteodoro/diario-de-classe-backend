import { jest } from '@jest/globals';
import util from 'node:util';
import { CreateUserService } from '../../../../src/services/user/createUserService.js';
import { UpdateUserService } from '../../../../src/services/user/updateUserService.js';
import { CreateUserController } from '../../../../src/controllers/user/createUserController.js';
import { UpdateUserController } from '../../../../src/controllers/user/updateUserController.js';
import { GetUserService } from '../../../../src/services/user/getUserService.js';
import { IsUserEmailExistsService } from '../../../../src/services/user/isUserEmailExistsService.js';
import { CreateDisponibilidadeProfessorService } from '../../../../src/services/disponibilidadeProfessor/createDisponibilidadeProfessorService.js';

// Valor sentinela: nunca deve aparecer, sob nenhuma forma, nos argumentos
// capturados de console.log/console.warn/console.error (NFR-001-001, metade
// backend). LoggerManager (src/utilities/loggerManager.js) não tem nenhuma
// chamada nos fluxos exercitados abaixo, por isso a instrumentação cobre só
// console.*.
const SENHA = 'segredo-super-secreto-nfr-001';

function buildRes() {
  return {
    statusCode: null,
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.data = payload;
      return this;
    }
  };
}

function buildReq(overrides = {}) {
  return {
    body: {
      nome: 'João',
      sobrenome: 'Silva',
      email: 'joao@teste.com',
      telefone: '11999999999',
      senha: SENHA,
      resetarSenha: false,
      permissao: 'member',
      idiomas: []
    },
    params: { id: 'clh4d6j8h0000kc1j5v3m2n4o' },
    validatedId: 'clh4d6j8h0000kc1j5v3m2n4o',
    t: key => key,
    ...overrides
  };
}

describe('Ausência de senha em log (NFR-001-001, metade backend)', () => {
  let logSpy, warnSpy, errorSpy;
  let originalGetUserHandle, originalIsEmailHandle, originalUpdateUserHandle;
  let originalCreateUserHandle, originalCreateDisponibilidadeHandle;

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    originalGetUserHandle = GetUserService.handle;
    originalIsEmailHandle = IsUserEmailExistsService.handle;
    originalUpdateUserHandle = UpdateUserService.handle;
    originalCreateUserHandle = CreateUserService.handle;
    originalCreateDisponibilidadeHandle = CreateDisponibilidadeProfessorService.handle;
  });

  afterEach(() => {
    logSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();

    GetUserService.handle = originalGetUserHandle;
    IsUserEmailExistsService.handle = originalIsEmailHandle;
    UpdateUserService.handle = originalUpdateUserHandle;
    CreateUserService.handle = originalCreateUserHandle;
    CreateDisponibilidadeProfessorService.handle = originalCreateDisponibilidadeHandle;
  });

  // JSON.stringify(new Error(...)) vira '{}' — ausência infalsificável; util.inspect
  // com depth: null serializa mensagem, stack e propriedades próprias do erro.
  function capturedLogText() {
    return [logSpy, warnSpy, errorSpy]
      .flatMap(spy => spy.mock.calls)
      .flat()
      .map(arg => util.inspect(arg, { depth: null }))
      .join(' ');
  }

  function expectNoSenhaLogged() {
    expect(capturedLogText()).not.toContain(SENHA);
  }

  // Lição controle-positivo-e-por-assercao-nao-por-mecanismo: cada spy de ausência
  // (log/warn/error) tem seu próprio controle positivo nesta suíte.
  test('controle positivo: console.log dispara e é capturado pelo spy', () => {
    const marcador = 'controle-positivo-console-log';
    console.log(marcador);
    expect(logSpy).toHaveBeenCalledWith(marcador);
  });

  test('controle positivo: console.warn dispara e é capturado pelo spy', () => {
    const marcador = 'controle-positivo-console-warn';
    console.warn(marcador);
    expect(warnSpy).toHaveBeenCalledWith(marcador);
  });

  test('controle de detecção: argumento logado contendo a senha faz o texto capturado conter a senha (a ausência não é vácua)', () => {
    console.log(`valor logado de exemplo: ${SENHA}`);
    expect(capturedLogText()).toContain(SENHA);
  });

  test('CreateUserService.handle com senha preenchida não loga a senha', async () => {
    const data = {
      nome: 'Maria',
      sobrenome: 'Souza',
      email: 'maria@teste.com',
      telefone: '11988887777',
      senha: SENHA,
      resetarSenha: false,
      permissao: 'member',
      idiomas: []
    };

    await CreateUserService.handle(data);

    expectNoSenhaLogged();
  });

  test('UpdateUserService.handle com senha preenchida não loga a senha', async () => {
    const data = {
      nome: 'Maria Atualizada',
      email: 'maria@teste.com',
      senha: SENHA
    };

    await UpdateUserService.handle('clh4d6j8h0000kc1j5v3m2n4o', data);

    expectNoSenhaLogged();
  });

  test('CreateUserController.handle com senha preenchida não loga a senha (sucesso)', async () => {
    IsUserEmailExistsService.handle = async () => false;
    CreateUserService.handle = async body => ({
      id: 'new-user-id',
      ...body,
      disponibilidades: []
    });
    let seq = 0;
    CreateDisponibilidadeProfessorService.handle = async dispon => {
      seq += 1;
      return { id: `d-${seq}`, ...dispon };
    };

    const req = buildReq();
    const res = buildRes();

    await CreateUserController.handle(req, res);

    expect(res.statusCode).toBe(201);
    expectNoSenhaLogged();
  });

  test('UpdateUserController.handle com senha preenchida não loga a senha (sucesso)', async () => {
    GetUserService.handle = async () => ({
      id: 'clh4d6j8h0000kc1j5v3m2n4o',
      email: 'joao@teste.com'
    });
    IsUserEmailExistsService.handle = async () => false;
    UpdateUserService.handle = async (id, data) => ({ id, ...data });

    const req = buildReq();
    const res = buildRes();

    await UpdateUserController.handle(req, res);

    expect(res.statusCode).toBe(200);
    expectNoSenhaLogged();
  });

  test('caso de produção: PrismaClientValidationError com a senha na message é redigido antes de chegar ao console.error (DEC-002-006)', async () => {
    GetUserService.handle = async () => {
      const erro = new Error(`Invalid \`prisma.user.update()\` invocation: senha: "${SENHA}"`);
      erro.name = 'PrismaClientValidationError';
      throw erro;
    };

    const req = buildReq();
    const res = buildRes();

    await UpdateUserController.handle(req, res);

    expect(res.statusCode).toBe(500);
    // controle positivo de console.error: o handleError realmente chamou o spy.
    expect(errorSpy).toHaveBeenCalledTimes(1);

    expectNoSenhaLogged();
  });
});
