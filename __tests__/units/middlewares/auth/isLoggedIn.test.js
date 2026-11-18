import { jest } from '@jest/globals';
import isLoggedIn from '../../../../src/middlewares/auth/isLoggedIn.js';
import UnauthorizedError from '../../../../src/utilities/errors/unauthorized.js';
import ServiceUnavailableError from '../../../../src/utilities/errors/serviceUnavailable.js';
import Constants from '../../../../src/utilities/constants.js';
import { createJwt } from '../../../../src/utilities/createJwt.js';
import SessaoLoginRepository from '../../../../src/repositories/sessaoLoginRepository.js';
import { VerificarSessaoAtivaService } from '../../../../src/services/auth/verificarSessaoAtivaService.js';
import { tokenDe, sidDe } from '../../../mocks/accessDeTeste.js';
import {
  sessaoAtiva,
  sessaoEncerrada,
  sessaoVencida,
  sessaoDeOutroUsuario,
  sessaoIndisponivel
} from '../../../mocks/sessaoAtiva.js';

const USUARIO = 'usuario-de-teste';

describe('isLoggedIn middleware', () => {
  let req;
  let next;

  const chamar = async authorization => {
    req.headers.authorization = authorization;
    await isLoggedIn(req, {}, next);
  };
  const comAccess = (claims = {}) => chamar(`Bearer ${tokenDe({ id: USUARIO, ...claims })}`);
  const assinar = claims => createJwt({ sub: USUARIO, ...claims }, Constants.jwtSecret, 60);

  beforeEach(() => {
    req = { headers: {} };
    next = jest.fn();
  });

  describe('credencial inválida (nenhuma consulta ao registro)', () => {
    let lerEstado;
    beforeEach(() => {
      lerEstado = sessaoAtiva(USUARIO);
    });

    test('sem cabeçalho Authorization: UnauthorizedError', async () => {
      await isLoggedIn(req, {}, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(UnauthorizedError);
      expect(lerEstado).not.toHaveBeenCalled();
    });

    test('token malformado: UnauthorizedError', async () => {
      await chamar('Bearer malformed.token');

      expect(next.mock.calls[0][0]).toBeInstanceOf(UnauthorizedError);
      expect(lerEstado).not.toHaveBeenCalled();
    });

    test('assinatura inválida: UnauthorizedError', async () => {
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
      const payload = Buffer.from(
        JSON.stringify({ sub: '123', exp: Math.floor(Date.now() / 1000) + 60 })
      ).toString('base64');
      await chamar(`Bearer ${header}.${payload}.invalidsignature`);

      expect(next.mock.calls[0][0]).toBeInstanceOf(UnauthorizedError);
      expect(lerEstado).not.toHaveBeenCalled();
    });

    test('token vencido: UnauthorizedError', async () => {
      const vencido = createJwt(
        { sub: USUARIO, ver: Constants.accessTokenVersion, sid: sidDe(USUARIO) },
        Constants.jwtSecret,
        -10
      );
      await chamar(`Bearer ${vencido}`);

      expect(next.mock.calls[0][0]).toBeInstanceOf(UnauthorizedError);
      expect(lerEstado).not.toHaveBeenCalled();
    });

    test('role adulterada (assinatura original mantida): UnauthorizedError', async () => {
      const [cabecalho, corpo, assinatura] = tokenDe({ id: USUARIO, role: 'professor' }).split('.');
      const claims = JSON.parse(Buffer.from(corpo, 'base64url').toString());
      const adulterado = Buffer.from(JSON.stringify({ ...claims, role: 'admin' })).toString(
        'base64url'
      );
      await chamar(`Bearer ${cabecalho}.${adulterado}.${assinatura}`);

      expect(next.mock.calls[0][0]).toBeInstanceOf(UnauthorizedError);
      expect(lerEstado).not.toHaveBeenCalled();
    });

    test('token sem ver é recusado', async () => {
      await chamar(`Bearer ${assinar({ sid: sidDe(USUARIO) })}`);

      expect(next.mock.calls[0][0]).toBeInstanceOf(UnauthorizedError);
      expect(req.user).toBeUndefined();
      expect(lerEstado).not.toHaveBeenCalled();
    });

    test('ver vigente + 1 é recusado', async () => {
      await comAccess({ ver: Constants.accessTokenVersion + 1 });

      expect(next.mock.calls[0][0]).toBeInstanceOf(UnauthorizedError);
      expect(lerEstado).not.toHaveBeenCalled();
    });

    // A única causa de recusa é a versão: sid válido, sessão ativa no dublê e sub correto.
    test('access de ver 2 (formato anterior) com sid válido e sessão ativa: UnauthorizedError', async () => {
      await comAccess({ ver: 2 });

      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(UnauthorizedError);
      expect(lerEstado).not.toHaveBeenCalled();
    });

    test.each([
      ['sem sid', null],
      ['sid string vazia', { sid: '' }],
      ['sid numérico', { sid: 12345 }],
      ['sid de 10 KB', { sid: 's'.repeat(10 * 1024) }]
    ])('access %s: UnauthorizedError antes de qualquer consulta', async (_nome, claims) => {
      if (claims) await comAccess(claims);
      else await chamar(`Bearer ${assinar({ ver: Constants.accessTokenVersion })}`);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(UnauthorizedError);
      expect(lerEstado).not.toHaveBeenCalled();
    });

    test('controle: sid válido e desconhecido consulta o registro 1 vez e é recusado', async () => {
      lerEstado.mockResolvedValue(null);

      await comAccess();

      expect(lerEstado).toHaveBeenCalledTimes(1);
      expect(lerEstado).toHaveBeenCalledWith(sidDe(USUARIO));
      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(UnauthorizedError);
    });
  });

  describe('sessão pelo dublê (contrato de sessaoAtiva.js)', () => {
    test('sessaoAtiva: next() sem argumento exatamente 1 vez e req.user preenchido', async () => {
      sessaoAtiva(USUARIO);

      await comAccess({ role: 'professor' });

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
      expect(req.user.sub).toBe(USUARIO);
      expect(req.user.isAdmin).toBe(false);
    });

    test('isAdmin vem só da claim role assinada', async () => {
      sessaoAtiva(USUARIO);

      await comAccess({ role: 'admin' });

      expect(req.user.isAdmin).toBe(true);
    });

    test.each([
      ['sessaoEncerrada', () => sessaoEncerrada(USUARIO)],
      ['sessaoVencida', () => sessaoVencida(USUARIO)],
      ['sessaoDeOutroUsuario', () => sessaoDeOutroUsuario()]
    ])('%s: next com UnauthorizedError e sem req.user', async (_nome, instalar) => {
      instalar();

      await comAccess();

      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(UnauthorizedError);
      expect(req.user).toBeUndefined();
    });

    test('sessaoIndisponivel: next 1 vez com ServiceUnavailableError, nunca next()', async () => {
      sessaoIndisponivel();

      await comAccess();

      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(ServiceUnavailableError);
      expect(next).not.toHaveBeenCalledWith();
    });

    test('exceção não-ORM dentro da verificação: negada, nunca next()', async () => {
      jest.spyOn(VerificarSessaoAtivaService, 'handle').mockRejectedValue(new TypeError('boom'));

      await comAccess();

      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(ServiceUnavailableError);
      expect(next).not.toHaveBeenCalledWith();
    });

    test('exceção não-ORM lançada pelo registro: negada (nunca next())', async () => {
      jest
        .spyOn(SessaoLoginRepository.prototype, 'lerEstado')
        .mockRejectedValue(new TypeError('x'));

      await comAccess();

      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(ServiceUnavailableError);
      expect(next).not.toHaveBeenCalledWith();
    });
  });

  describe('não afrouxado (DEC-005-022)', () => {
    test('sem o dublê, com o registro vazio de hoje, o access com sid válido é recusado', async () => {
      await comAccess();

      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(UnauthorizedError);
      expect(req.user).toBeUndefined();
    });
  });
});
